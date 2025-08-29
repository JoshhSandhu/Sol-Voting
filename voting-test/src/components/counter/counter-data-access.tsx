'use client'

import { getCounterProgram as getVotingProgram, getCounterProgramId as getVotingProgramId } from '../../../anchor/src'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'
import { AnchorProvider, BN, Wallet } from '@coral-xyz/anchor'

// Helper function to get or create a keypair from local storage
function getLocalStorageKeypair(key: string): Keypair {
  const stored = window.localStorage.getItem(key)
  if (stored) {
    return Keypair.fromSecretKey(new Uint8Array(JSON.parse(stored)))
  }
  const keypair = Keypair.generate()
  window.localStorage.setItem(key, JSON.stringify(Array.from(keypair.secretKey)))
  return keypair
}

export function useVotingProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()

  // Get or create a local keypair to use as the signer
  const signer = useMemo(() => getLocalStorageKeypair('signer'), [])

  // Create a custom AnchorProvider using the local signer
  const provider = useMemo(
    () => new AnchorProvider(connection, new Wallet(signer), { commitment: 'confirmed' }),
    [connection, signer],
  )

  const programId = useMemo(() => getVotingProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getVotingProgram(provider, programId), [provider, programId])

  const pollAccounts = useQuery({
    queryKey: ['voting', 'allPolls', { cluster }],
    queryFn: () => program.account.pollAccount.all(),
  })

  const initializePoll = useMutation({
    mutationKey: ['voting', 'initializePoll', { cluster }],
    mutationFn: async ({ pollId, name, description }: { pollId: BN; name: string; description: string }) => {
      const [pollAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from('poll'), pollId.toArrayLike(Buffer, 'le', 8)],
        program.programId,
      )
      const startTime = new BN(Math.floor(Date.now() / 1000))
      const endTime = new BN(startTime.toNumber() + 86400)

      return program.methods
        .initializePoll(pollId, startTime, endTime, name, description)
        .accounts({
          signer: signer.publicKey,
          pollAccount: pollAddress,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return pollAccounts.refetch()
    },
    onError: (err: any) => {
      toast.error('Failed to initialize poll', { description: err.message })
    },
  })

  return {
    program,
    programId,
    pollAccounts,
    initializePoll,
    signer, // Expose the signer if needed elsewhere
  }
}

export function useVotingProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const { program } = useVotingProgram()

  const accountQuery = useQuery({
    queryKey: ['voting', 'fetchPoll', { cluster, account }],
    queryFn: () => program.account.pollAccount.fetch(account),
  })

  return {
    accountQuery,
  }
}
