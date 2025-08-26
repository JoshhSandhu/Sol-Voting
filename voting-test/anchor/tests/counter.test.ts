import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program } from "@coral-xyz/anchor";


const IDL = require("../target/idl/voting.json");
import { Voting } from '../target/types/voting';

const PUPPET_PROGRAM_ID = new PublicKey("FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS");

describe('Create a system account', () => {

  test("bankrun", async () => {
    const context = await startAnchor(".", [{name: "voting", programId: PUPPET_PROGRAM_ID}], []);
    const provider = new BankrunProvider(context);

    const puppetProgram = new Program<Voting>(
      IDL,
      provider,
    );

    const pollId = new anchor.BN(1);
    const [pollAddress] = PublicKey.findProgramAddressSync(
      [pollId.toArrayLike(Buffer, "le", 8)],
      puppetProgram.programId
    );

    await puppetProgram.methods.initializePoll(
        pollId,
        "test-poll",
        new anchor.BN(0),
        new anchor.BN(1759508293)
    ).accounts({
      poll: pollAddress,
      signer: provider.wallet.publicKey,
    })
    .rpc();

    const pollAccount = await puppetProgram.account.poll.fetch(pollAddress);
    console.log(pollAccount);

  });

});