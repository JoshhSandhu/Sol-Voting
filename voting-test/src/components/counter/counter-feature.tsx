'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useVotingProgram } from './counter-data-access'
import { PollCreate, PollList } from './counter-ui'
import { AppHero } from '../app-hero'
import { ellipsify } from '@/lib/utils'

export default function VotingFeature() {
  const { publicKey } = useWallet()
  const { programId } = useVotingProgram()

  return publicKey ? (
    <div>
      <AppHero
        title="Solana Voting"
        subtitle={
          'Create a new poll by clicking the "Create Poll" button. Once a poll is created, you can add candidates and vote.'
        }
      >
        <p className="mb-6">
          <ExplorerLink path={`account/${programId}`} label={ellipsify(programId.toString())} />
        </p>
        <PollCreate />
      </AppHero>
      <PollList />
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  )
}
