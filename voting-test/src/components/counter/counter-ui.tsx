'use client'

import { PublicKey } from '@solana/web3.js'
import { useState } from 'react'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useVotingProgram } from './counter-data-access'
import { ellipsify } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '@/components/ui/input'
import * as anchor from '@coral-xyz/anchor'

// Component to create a new poll
export function PollCreate() {
  const { initializePoll } = useVotingProgram()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleCreatePoll = () => {
    // A simple way to generate a new poll ID. In a real app, you might use a counter or a more robust system.
    const pollId = new anchor.BN(Math.floor(Math.random() * 10000))
    if (!name.trim() || !description.trim()) {
      alert('Please provide a name and description for the poll.')
      return
    }
    initializePoll.mutateAsync({ pollId, name, description })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Poll</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Poll Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          placeholder="Poll Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button onClick={handleCreatePoll} disabled={initializePoll.isPending}>
          Create Poll {initializePoll.isPending && '...'}
        </Button>
      </CardContent>
    </Card>
  )
}

// Component to list existing polls
export function PollList() {
  const { pollAccounts } = useVotingProgram()

  if (pollAccounts.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }
  if (!pollAccounts.data?.length) {
    return (
      <div className="text-center">
        <h2 className={'text-2xl'}>No Polls Found</h2>
        Create one above to get started.
      </div>
    )
  }
  return (
    <div className={'space-y-6'}>
      <div className="grid md:grid-cols-2 gap-4">
        {pollAccounts.data?.map((account) => (
          <PollCard key={account.publicKey.toString()} account={account.account} publicKey={account.publicKey} />
        ))}
      </div>
    </div>
  )
}

// Component to display a single poll
function PollCard({ account, publicKey }: { account: any; publicKey: PublicKey }) {
  // The account object from pollAccounts.data contains account data and the public key
  return (
    <Card>
      <CardHeader>
        <CardTitle>{account.pollName}</CardTitle>
        <CardDescription>Ends: {new Date(account.pollVotingEnd * 1000).toLocaleString()}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{account.pollDescription}</p>
        <div className="mt-4">
          <ExplorerLink path={`account/${publicKey}`} label={ellipsify(publicKey.toString())} />
        </div>
        {/* UI for candidates and voting would go here */}
      </CardContent>
    </Card>
  )
}
