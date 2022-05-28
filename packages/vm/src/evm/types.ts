import { Block } from '@ethereumjs/block'
import { Account, Address } from 'ethereumjs-util'
import { ReadableByteStreamController } from 'stream/web'
import EVM from './evm'
import Memory from './memory'
import Message from './message'
import { OpHandler } from './opcodes'
import { AsyncDynamicGasHandler, SyncDynamicGasHandler } from './opcodes/gas'
import Stack from './stack'

/**
 * Log that the contract emits.
 */
export type Log = [address: Buffer, topics: Buffer[], data: Buffer]

export type DeleteOpcode = {
  opcode: number
}

export type AddOpcode = {
  opcode: number
  opcodeName: string
  baseFee: number
  gasFunction?: AsyncDynamicGasHandler | SyncDynamicGasHandler
  logicFunction: OpHandler
}

export type CustomOpcode = AddOpcode | DeleteOpcode

/**
 * Options for running a call (or create) operation
 */
export interface RunCallOpts {
  /**
   * The `@ethereumjs/block` the `tx` belongs to. If omitted a default blank block will be used.
   */
  block?: Block
  /**
   * The gas price for the call. Defaults to `0`
   */
  gasPrice?: bigint
  /**
   * The address where the call originated from. Defaults to the zero address.
   */
  origin?: Address
  /**
   * The address that ran this code (`msg.sender`). Defaults to the zero address.
   */
  caller?: Address
  /**
   * The gas limit for the call. Defaults to `0xffffff`
   */
  gasLimit?: bigint
  /**
   * The to address. Defaults to the zero address.
   */
  to?: Address
  /**
   * The value in ether that is being sent to `opts.to`. Defaults to `0`
   */
  value?: bigint
  /**
   * The data for the call.
   */
  data?: Buffer
  /**
   * This is for CALLCODE where the code to load is different than the code from the `opts.to` address.
   */
  code?: Buffer
  /**
   * The call depth. Defaults to `0`
   */
  depth?: number
  /**
   * If the code location is a precompile.
   */
  isCompiled?: boolean
  /**
   * If the call should be executed statically. Defaults to false.
   */
  isStatic?: boolean
  /**
   * An optional salt to pass to CREATE2.
   */
  salt?: Buffer
  /**
   * Addresses to selfdestruct. Defaults to none.
   */
  selfdestruct?: { [k: string]: boolean }
  /**
   * Skip balance checks if true. Adds transaction value to balance to ensure execution doesn't fail.
   */
  skipBalance?: boolean
  /**
   * If the call is a DELEGATECALL. Defaults to false.
   */
  delegatecall?: boolean
  /**
   * Optionally pass in an already-built message.
   */
  message?: Message
}

/**
 * Options for the runCode method.
 */
export interface RunCodeOpts {
  /**
   * The `@ethereumjs/block` the `tx` belongs to. If omitted a default blank block will be used.
   */
  block?: Block
  /**
   * Pass a custom {@link EVM} to use. If omitted the default {@link EVM} will be used.
   */
  evm?: EVM
  /**
   * The gas price for the call. Defaults to `0`
   */
  gasPrice?: bigint
  /**
   * The address where the call originated from. Defaults to the zero address.
   */
  origin?: Address
  /**
   * The address that ran this code (`msg.sender`). Defaults to the zero address.
   */
  caller?: Address
  /**
   * The EVM code to run.
   */
  code?: Buffer
  /**
   * The input data.
   */
  data?: Buffer
  /**
   * The gas limit for the call.
   */
  gasLimit: bigint
  /**
   * The value in ether that is being sent to `opts.address`. Defaults to `0`
   */
  value?: bigint
  /**
   * The call depth. Defaults to `0`
   */
  depth?: number
  /**
   * If the call should be executed statically. Defaults to false.
   */
  isStatic?: boolean
  /**
   * Addresses to selfdestruct. Defaults to none.
   */
  selfdestruct?: { [k: string]: boolean }
  /**
   * The address of the account that is executing this code (`address(this)`). Defaults to the zero address.
   */
  address?: Address
  /**
   * The initial program counter. Defaults to `0`
   */
  pc?: number
}

/**
 * Tx context for vm execution
 */
export interface TxContext {
  gasPrice: bigint
  origin: Address
}

/**
 * Frame logic: this frame logic represents the current state of the call/create frame
 * This holds all the information which the EVM Interpreter needs
 * ALL values are optional and will default to something if they are not present
 * 
 * How to know if a frame is a Call or a Create?
 * Create: has a `code` field
 * Call: has a `to` field
 * Note: `to` defaults to the zero address
 * Note: `code` defaults to the empty buffer
 * Prior to defaulting those, it is thus clear whether it is a CallFrame or a CreateFrame
 * 
 * Proposed behavior: in case `to` is set but no `code` then read code from `to` account to set it
 * -> How to handle other call or create types?
 *    All messages copy current isStatic and increase depth by 1
 *      CALL
 *         Caller: env.to
 *         To:     (ENV stack item)
 *         Code: (can optionally load this)
 *      CALLCODE
 *         Caller: env.to
 *         To:     env.to
 *         Code:   load address from stack and explicitly load this
 *      DELEGATECALL
 *          Caller: env.caller
 *          To:     env.to
 *          Code:   load address from stack and explictly load this
 *      STATICCALL  
 *          Same as CALL except:
 *              IsStatic: true
 *      AUTHCALL
 *          Same as CALL except 
 *              Caller: env.auth
 *              TransferFrom: env.to
 *              
 * // Note possibly make an extra helper "env.currentCodeAddress" which is immediately set to "env.to" to make code more clear         
 */

/**
 * The base frame environment
 * This is available for both CALLs and CREATEs
 */
/*type BaseFrameEnvironment = {
  caller?: Address    // The caller address
  gasLeft?: bigint    // The current gas left
  value?: bigint      // The call/create value
  valueTransferFrom?: Address // Address to take value from (used in AUTHCALL, here value is taken from a different address than caller). Defaults to `caller`
  // Note regarding AUTHCALL: if valueExt ever gets activated then this can be done in the AUTHCALL opcode directly (transfer funds from AUTH address to target address, throw if not enough balance)
  code?: Buffer       // Code in the current frame (this code is set as "calldata" in a CREATE frame, in a CREATE frame there is no `data` field)
  to?: Address        // The target address (if set, this is a CallFrame, if not set, this is a CreateFrame)
  depth?: number      // The call depth (defaults to 0)
  isStatic?: boolean  // True if the current frame (and also next/deeper frames) are in static mode (no state modifications allowed)
  selfdestruct?: { [k: string]: boolean } // address -> boolean map of already selfdestructed addresses (to prevent refunding selfdestructed addresses twice)
}*/

/*type CreateFrameEnvironment = BaseFrameEnvironment
type CallFrameEnvironment = BaseFrameEnvironment & {
  to: Address // If a `to` field is available this is automatically a CALL frame. Otherwise, it is a CREATE frame
  data?: Buffer // The calldata
}*/

/**
 * The frame environment holds all info of the current call/create frame
 * Note that this will internally also hold information such as selfdestructed addresses,
 * if the frame is static (due to previous STATICCALL), whatever AUTH parameter is set, etc.
 */
//export type FrameEnvironment = CreateFrameEnvironment | CallFrameEnvironment

/**
 * The global environment makes data available to the EVM which is necessary for some opcodes
 */
/*export type GlobalEnvironment = {
  origin?: Address // The address which created this transaction
  gasPrice?: bigint // The gasPrice of the transaction
  block?: Block // Current block environment
  chainId?: bigint // The chainId of the current chain
}*/

/**
 * The EVMEnvironment is used to setup the necessary context in order to run EVM calls/creates
 */
/*export type EVMEnvironment = {
  FrameEnvironment: FrameEnvironment
  GlobalEnvironment: GlobalEnvironment
}*/

// Minimal types to ensure runTx -> EVM step can be made
export type BaseFrameEnvironment = {
  caller?: Address    // The caller address
  gasLimit?: bigint    // The gasLimit of the frame
  value?: bigint      // The call/create value
  data?: Buffer       // Data of the frame. In case no `to` field is present, this is the `code`, not the `callData`
  to?: Address        // The target address (if set, this is a CallFrame, if not set, this is a CreateFrame)
}

export type CreateFrameEnvironment = BaseFrameEnvironment
export type CallFrameEnvironment = BaseFrameEnvironment & {
  to: Address // If a `to` field is available this is automatically a CALL frame. Otherwise, it is a CREATE frame
}

export type FrameEnvironment = CreateFrameEnvironment | CallFrameEnvironment

export type GlobalEnvironment = {
  block?: Block,    // Block Tx runs in (TODO remove Block dependency and instead just ensure all necessary fields can be queried -> probably only need Header not entire block)
  gasPrice?: bigint // Tx GasPrice
}

// Internally in EVM, members of this type are static (so the variables will /not/ change upon running contract code)
// Note: these stay static inside the current call/create frame
export type EVMEnvironment = {
  frameEnvironment?: FrameEnvironment
  globalEnvironment?: GlobalEnvironment
}

// MachineState: this is the internal state of the Machine and changes dynamically
export type MachineState = {
  gasLeft?: bigint, // Current gas left 
  programCounter?: number, 
  memory?: Memory,
  memoryWordCount?: bigint, // This property is probably not necessary, can immediately read from memory.length since this is now properly resized
  highestMemCost?: bigint, // TODO figure out what this is and why we need to keep track of this
  stack?: Stack,
  returnStack?: Stack,
  validJumps?: Uint8Array, // TODO check if `shouldDoJumpAnalysis` can be removed -> if `validJumps === undefined` then do analysis
  shouldDoJumpAnalysis?: boolean
  selfdestruct?: { [k: string]: boolean } // address -> boolean map of already selfdestructed addresses (to prevent refunding selfdestructed addresses twice)
}

// Note: any precompile-related logic is removed, this should be retrieved into `runCall` (i.e. decide if it is a precompile or not)
export type EVMEnvironmentExtended = EVMEnvironment & {
  frameEnvironment: FrameEnvironment & {
    machineState?: MachineState
    // valueTransferFrom?: Address // Address to take value from in AUTHCALL -> probably not necessary can be handled in functions.ts
    isStatic?: boolean // If frame is in static mode
    depth?: number // Current calldepth
    salt?: Buffer // Salt used for CREATE2
    code?: Buffer // Code to run (either contract code or creation code in a CREATE frame)
  }
}



/**
 * The ExternalInterface provides the interface which the EVM will use
 * to interact with the external environment, such as getting and storing code,
 * getting and storing storage, getting account balances, etc.
 */
export interface ExternalInterface {
  // TODO this is a skeleton and not implemented yet
  /**
   * Returns code of an account.
   * @param address - Address of account
   */
  getCode(address: Address): Promise<Buffer>
  /**
   * Returns the hash of one of the 256 most recent complete blocks.
   * @param num - Number of block
   */
  getBlockHash(num: bigint): Promise<bigint>
  /**
   * Store 256-bit a value in memory to persistent storage.
   */
  storageStore(address: Address, key: Buffer, value: Buffer): Promise<void>
  /**
   * Loads a 256-bit value to memory from persistent storage.
   * @param address - Address of the storage trie to load
   * @param key - Storage key
   *    * @param original - If true, return the original storage value (default: false). This is used for gas metering dependend upon the original storage values
   */
  storageLoad(address: Address, key: Buffer): Promise<Buffer>

  /**
   * Returns an account at the given `address
   * @param address Address to lookup
   */
  getAccount(address: Address): Promise<Account>

  /**
   * Returns true if account is empty or non-existent (according to EIP-161).
   * @param address - Address of account
   */
  isAccountEmpty(address: Address): Promise<boolean>

  /**
   * Returns true if account exists in the state trie (it can be empty). Returns false if the account is `null`.
   * @param address - Address of account
   */
  accountExists(address: Address): Promise<boolean>

  /**
   * Checkpoints the current external state
   */
  checkpoint(): Promise<void>
  /**
   * Commits the current external state
   * Note: can still be reverted at a higher level
   */
  commit(): Promise<void>
  /**
   * Revert the current external state
   */
  revert(): Promise<void>

  /**
   * Returns an account at the given `address
   * @param address Address to lookup
   */
  getAccount(address: Address): Promise<Account>
}

type EVMResult = {
  error?: any // TODO Add error type
  returnData: Buffer
  logs: Log[]
}

export interface EVMInterface {
  runMessage(environment: EVMEnvironment): Promise<EVMResult>
}
