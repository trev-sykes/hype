import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  Burned,
  Minted,
  ProtocolFeeRecipientChanged,
  TokenCreated
} from "../generated/ETHBackedTokenMinter/ETHBackedTokenMinter"

export function createBurnedEvent(
  seller: Address,
  tokenId: BigInt,
  amount: BigInt,
  refund: BigInt,
  newReserve: BigInt,
  newTotalSupply: BigInt
): Burned {
  let burnedEvent = changetype<Burned>(newMockEvent())

  burnedEvent.parameters = new Array()

  burnedEvent.parameters.push(
    new ethereum.EventParam("seller", ethereum.Value.fromAddress(seller))
  )
  burnedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  burnedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  burnedEvent.parameters.push(
    new ethereum.EventParam("refund", ethereum.Value.fromUnsignedBigInt(refund))
  )
  burnedEvent.parameters.push(
    new ethereum.EventParam(
      "newReserve",
      ethereum.Value.fromUnsignedBigInt(newReserve)
    )
  )
  burnedEvent.parameters.push(
    new ethereum.EventParam(
      "newTotalSupply",
      ethereum.Value.fromUnsignedBigInt(newTotalSupply)
    )
  )

  return burnedEvent
}

export function createMintedEvent(
  buyer: Address,
  tokenId: BigInt,
  amount: BigInt,
  cost: BigInt,
  newReserve: BigInt,
  newTotalSupply: BigInt
): Minted {
  let mintedEvent = changetype<Minted>(newMockEvent())

  mintedEvent.parameters = new Array()

  mintedEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  mintedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  mintedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  mintedEvent.parameters.push(
    new ethereum.EventParam("cost", ethereum.Value.fromUnsignedBigInt(cost))
  )
  mintedEvent.parameters.push(
    new ethereum.EventParam(
      "newReserve",
      ethereum.Value.fromUnsignedBigInt(newReserve)
    )
  )
  mintedEvent.parameters.push(
    new ethereum.EventParam(
      "newTotalSupply",
      ethereum.Value.fromUnsignedBigInt(newTotalSupply)
    )
  )

  return mintedEvent
}

export function createProtocolFeeRecipientChangedEvent(
  oldRecipient: Address,
  newRecipient: Address
): ProtocolFeeRecipientChanged {
  let protocolFeeRecipientChangedEvent =
    changetype<ProtocolFeeRecipientChanged>(newMockEvent())

  protocolFeeRecipientChangedEvent.parameters = new Array()

  protocolFeeRecipientChangedEvent.parameters.push(
    new ethereum.EventParam(
      "oldRecipient",
      ethereum.Value.fromAddress(oldRecipient)
    )
  )
  protocolFeeRecipientChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newRecipient",
      ethereum.Value.fromAddress(newRecipient)
    )
  )

  return protocolFeeRecipientChangedEvent
}

export function createTokenCreatedEvent(
  tokenId: BigInt,
  name: string,
  symbol: string,
  creator: Address
): TokenCreated {
  let tokenCreatedEvent = changetype<TokenCreated>(newMockEvent())

  tokenCreatedEvent.parameters = new Array()

  tokenCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  tokenCreatedEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  tokenCreatedEvent.parameters.push(
    new ethereum.EventParam("symbol", ethereum.Value.fromString(symbol))
  )
  tokenCreatedEvent.parameters.push(
    new ethereum.EventParam("creator", ethereum.Value.fromAddress(creator))
  )

  return tokenCreatedEvent
}
