// One invocation of the Arr Stack module against real members, for the
// server's live test: input JSON in ARR_STACK_INVOKE, reply JSON on stdout.
import { invoke } from "../../src/main.mjs";

const reply = await invoke(JSON.parse(process.env.ARR_STACK_INVOKE ?? "null"));
process.stdout.write(JSON.stringify(reply));
