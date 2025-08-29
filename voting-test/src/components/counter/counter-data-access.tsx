'use client'

import { getCounterProgram as getVotingProgram, getCounterProgramId as getVotingProgramId } from '../../../anchor/src'
import { useConnection } from '@solana/wallet-adapter-react'
import {
  Cluster,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'
import { AnchorProvider, BN } from '@coral-xyz/anchor'

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
  const client = useQueryClient()

  const [signer, setSigner] = useState<Keypair | null>(null)

  useEffect(() => {
    setSigner(getLocalStorageKeypair('signer'))
  }, [])

  // Manually create a wallet object that conforms to the Anchor Wallet interface
  const wallet = useMemo(() => {
    if (!signer) return null
    return {
      publicKey: signer.publicKey,
      signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T) => {
        if ('version' in tx) {
          tx.sign([signer])
        } else {
          tx.partialSign(signer)
        }
        return tx
      },
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]) => {
        for (const tx of txs) {
          if ('version' in tx) {
            tx.sign([signer])
          } else {
            tx.partialSign(signer)
          }
        }
        return txs
      },
    }
  }, [signer])

  const provider = useMemo(() => {
    if (!wallet) return null
    return new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
  }, [connection, wallet])

  const programId = useMemo(() => getVotingProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => {
    if (!provider) return null
    return getVotingProgram(provider, programId)
  }, [provider, programId])

  const pollAccounts = useQuery({
    queryKey: ['voting', 'allPolls', { cluster }],
    queryFn: () => program!.account.pollAccount.all(),
    enabled: !!program,
  })

  const getBalance = useQuery({
    queryKey: ['get-balance', { endpoint: connection.rpcEndpoint, account: signer?.publicKey.toString() }],
    queryFn: () => connection.getBalance(signer!.publicKey),
    enabled: !!signer,
  })

  const initializePoll = useMutation({
    mutationKey: ['voting', 'initializePoll', { cluster }],
    mutationFn: async ({ pollId, name, description }: { pollId: BN; name: string; description: string }) => {
      if (!program || !signer) throw new Error('Program or signer not initialized')
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

  const requestAirdrop = useMutation({
    mutationKey: ['airdrop', { cluster, account: signer?.publicKey.toString() }],
    mutationFn: async (amount: number = 1) => {
      if (!signer) throw new Error('Signer not initialized')
      const [latestBlockhash, signature] = await Promise.all([
        connection.getLatestBlockhash(),
        connection.requestAirdrop(signer.publicKey, amount * LAMPORTS_PER_SOL),
      ])

      await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')
      return signature
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return Promise.all([
        getBalance.refetch(),
        client.invalidateQueries({ queryKey: ['get-signatures'] }),
      ])
    },
    onError: (err: any) => {
      toast.error('Airdrop failed', { description: err.message })
    },
  })

  return {
    program,
    programId,
    pollAccounts,
    initializePoll,
    signer,
    getBalance,
    requestAirdrop,
    loading: !signer || !program,
  }
}

export function useVotingProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const { program } = useVotingProgram()

  const accountQuery = useQuery({
    queryKey: ['voting', 'fetchPoll', { cluster, account }],
    queryFn: () => program!.account.pollAccount.fetch(account),
    enabled: !!program,
  })

  return {
    accountQuery,
  }
}
