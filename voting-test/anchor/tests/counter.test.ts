import { BankrunProvider, startAnchor } from "anchor-bankrun";
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { Voting } from '../target/types/voting'; // generated types
const IDL = require('../target/idl/voting.json');

// Set the deployed program ID or local test validator keypair
const votingAddress = new PublicKey("FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS");

// Increase Jest timeout globally for this test file
jest.setTimeout(30000); // 30 seconds

describe('Voting', () => {

  it('Initialize poll', async () => {
    // Start the Anchor context with Bankrun
    const context = await startAnchor(
      "", // workspace path, empty string for default
      [
        {
          name: "voting",
          programID: votingAddress, // actual program ID
          idl: IDL                  // provide IDL explicitly
        }
      ],
      []
    );

    // Create a BankrunProvider from the context
    const provider = new BankrunProvider(context);

    // Initialize the program interface
    const VotingProgram = new Program<Voting>(
      IDL,
      provider
    );

    // Call the initializePoll method
    await VotingProgram.methods.initializePoll(
      new anchor.BN(1),                     // poll id
      "Best Programming Language",          // poll question
      new anchor.BN(0),                     // initial votes
      new anchor.BN(1821246480)             // end timestamp
    ).rpc();

  }); // end of it
});
