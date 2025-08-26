import { BankrunProvider, Program, startAnchor } from "anchor-bankrun";
import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { Voting } from '../target/types/voting';
import { expect } from '@jest/globals';
import * as path from 'path';
const idl = require('../target/idl/voting.json');

jest.setTimeout(30000);

describe('Voting', () => {
  let provider: BankrunProvider;
  let program: Program<Voting>;

  beforeAll(async () => {
    const context = await startAnchor(
      path.join(__dirname, '..'), // Point to the anchor project root
      [],
      []
    );
    provider = new BankrunProvider(context);
    // Manually create the program object
    program = new Program<Voting>(idl, provider);
  });

  it('Initialize poll', async () => {
    const pollId = new anchor.BN(1);
    const description = "Best Programming Language";
    const pollStart = new anchor.BN(Math.floor(Date.now() / 1000)); // Current time in seconds
    const pollEnd = new anchor.BN(pollStart.toNumber() + 60 * 60 * 24); // 1 day from now

    const [pollPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), pollId.toBuffer('le', 8)],
      program.programId
    );

    await program.methods.initializePoll(
      pollId,
      description,
      pollStart,
      pollEnd
    ).accounts({
      poll: pollPda,
      signer: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).rpc();

    const pollAccount = await program.account.poll.fetch(pollPda);
    expect(pollAccount.description).toEqual(description);
    expect(pollAccount.pollId.eq(pollId)).toBe(true);
  });
});
