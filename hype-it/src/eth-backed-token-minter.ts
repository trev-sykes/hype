import {
  Burned as BurnedEvent,
  Minted as MintedEvent,
  ProtocolFeeRecipientChanged as ProtocolFeeRecipientChangedEvent,
  TokenCreated as TokenCreatedEvent
} from "../generated/ETHBackedTokenMinter/ETHBackedTokenMinter"
import {
  Burned,
  Minted,
  ProtocolFeeRecipientChanged,
  TokenCreated
} from "../generated/schema"

export function handleBurned(event: BurnedEvent): void {
  let entity = new Burned(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.seller = event.params.seller
  entity.tokenId = event.params.tokenId
  entity.amount = event.params.amount
  entity.refund = event.params.refund
  entity.newReserve = event.params.newReserve
  entity.newTotalSupply = event.params.newTotalSupply

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMinted(event: MintedEvent): void {
  let entity = new Minted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.buyer = event.params.buyer
  entity.tokenId = event.params.tokenId
  entity.amount = event.params.amount
  entity.cost = event.params.cost
  entity.newReserve = event.params.newReserve
  entity.newTotalSupply = event.params.newTotalSupply

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleProtocolFeeRecipientChanged(
  event: ProtocolFeeRecipientChangedEvent
): void {
  let entity = new ProtocolFeeRecipientChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldRecipient = event.params.oldRecipient
  entity.newRecipient = event.params.newRecipient

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTokenCreated(event: TokenCreatedEvent): void {
  let entity = new TokenCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId
  entity.name = event.params.name
  entity.symbol = event.params.symbol
  entity.creator = event.params.creator

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
