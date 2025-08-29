'use client'

import { ExplorerLink } from '../cluster/cluster-ui'
import { useVotingProgram } from './counter-data-access'
import { PollCreate, PollList } from './counter-ui'
import { AppHero } from '../app-hero'
import { ellipsify } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useMemo } from 'react'

export default function VotingFeature() {
  const { programId, signer, getBalance, requestAirdrop, loading } = useVotingProgram()

  const balance = useMemo(() => {
    return (getBalance.data ?? 0) / LAMPORTS_PER_SOL
  }, [getBalance.data])

  if (loading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  if (!signer || !programId) {
    return <div>Error: Signer or Program not available.</div>
  }

  return (
    <div>
      <AppHero
        title="Solana Voting"
        subtitle={'This app uses a local keypair for signing. You may need to airdrop SOL to the signer address below.'}
      >
        <div className="space-y-2 text-center">
          <p>
            Program ID: <ExplorerLink path={`account/${programId}`} label={ellipsify(programId.toString())} />
          </p>
          <p>
            Local Signer: <ExplorerLink path={`account/${signer.publicKey}`} label={ellipsify(signer.publicKey.toString())} />
          </p>
          <p>Signer Balance: {balance.toFixed(4)} SOL</p>
          <Button onClick={() => requestAirdrop.mutateAsync(1)} disabled={requestAirdrop.isPending}>
            Airdrop 1 SOL {requestAirdrop.isPending && '...'}
          </Button>
        </div>
      </AppHero>
      <div className="space-y-6">
        <PollCreate />
        <PollList />
      </div>
    </div>
  )
}
