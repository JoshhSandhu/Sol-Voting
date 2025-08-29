'use client'

import { getCounterProgram as getVotingProgram, getCounterProgramId as getVotingProgramId } from '@/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Cluster, PublicKey, SystemProgram } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'
import * as anchor from '@coral-xyz/anchor'

export function useVotingProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const { publicKey } = useWallet()

  const programId = useMemo(() => getVotingProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getVotingProgram(provider, programId), [provider, programId])

  const pollAccounts = useQuery({
    queryKey: ['voting', 'allPolls', { cluster }],
    queryFn: () => program.account.pollAccount.all(),
  })

  const initializePoll = useMutation({
    mutationKey: ['voting', 'initializePoll', { cluster }],
    mutationFn: async ({ pollId, name, description }: { pollId: anchor.BN; name: string; description: string }) => {
      const [pollAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from('poll'), pollId.toArrayLike(Buffer, 'le', 8)],
        program.programId,
      )
      // Using placeholder start/end times for now
      const startTime = new anchor.BN(Math.floor(Date.now() / 1000))
      const endTime = new anchor.BN(startTime.toNumber() + 86400) // 24 hours from now

      return program.methods
        .initializePoll(pollId, startTime, endTime, name, description)
        .accounts({
          pollAccount: pollAddress,
          signer: provider.wallet.publicKey,
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
  }
}

// This hook is for a specific account and needs to be adapted for your program's accounts (PollAccount, CandidateAccount)
export function useVotingProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, pollAccounts } = useVotingProgram()

  // Example query for a single poll account
  const accountQuery = useQuery({
    queryKey: ['voting', 'fetchPoll', { cluster, account }],
    queryFn: () => program.account.pollAccount.fetch(account),
  })

  // You would add mutations for 'initializeCandidate' and 'vote' here,
  // which would operate on specific poll and candidate accounts.

  return {
    accountQuery,
  }
}
