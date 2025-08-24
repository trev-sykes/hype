import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { Burned } from "../generated/schema"
import { Burned as BurnedEvent } from "../generated/ETHBackedTokenMinter/ETHBackedTokenMinter"
import { handleBurned } from "../src/eth-backed-token-minter"
import { createBurnedEvent } from "./eth-backed-token-minter-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let seller = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let tokenId = BigInt.fromI32(234)
    let amount = BigInt.fromI32(234)
    let refund = BigInt.fromI32(234)
    let newReserve = BigInt.fromI32(234)
    let newTotalSupply = BigInt.fromI32(234)
    let newBurnedEvent = createBurnedEvent(
      seller,
      tokenId,
      amount,
      refund,
      newReserve,
      newTotalSupply
    )
    handleBurned(newBurnedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("Burned created and stored", () => {
    assert.entityCount("Burned", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "Burned",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "seller",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "Burned",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "tokenId",
      "234"
    )
    assert.fieldEquals(
      "Burned",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amount",
      "234"
    )
    assert.fieldEquals(
      "Burned",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "refund",
      "234"
    )
    assert.fieldEquals(
      "Burned",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "newReserve",
      "234"
    )
    assert.fieldEquals(
      "Burned",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "newTotalSupply",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
