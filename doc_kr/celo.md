# 서클의 셀로 `FiatToken` 디자인

이 문서는 [셀로](https://celo.org/) 네트워크에서 `FiatToken`을 지원하기 위해 서
클이 구현한 셀로 관련 로직을 설명합니다.

셀로 네트워크에 새로운 지원 가스 토큰을 추가하는 전체 프로세스는
[공식 문서](https://docs.celo.org/learn/add-gas-currency)에 제공되어 있으며, 토
큰 구현, 필요한 오라클 작업 및 거버넌스 제안 프로세스를 다룹니다.

## 차변 및 대변 개요

인터페이스를 보려면 `ICeloGasToken`을 참조하십시오. 셀로 가상 머신은 코어 셀로
VM의 상태 전환 알고리즘에서 트랜잭션의 일부로 `debitGasFees` 및
`creditGasFees`를 원자적으로 호출합니다. `celo-org/celo-blockchain`의
[소스 코드](https://github.com/celo-org/celo-blockchain/blob/3808c45addf56cf547581599a1cb059bc4ae5089/core/state_transition.go#L426-L526)를
참조하십시오. 특히 481행(`payFees`)과 517행(`distributeTxFees`)에 주목하십시오.

`address(0)`을 통해 호출하는 셀로 VM만 `debitGasFees` 및 `creditGasFees`를 호출
할 수 있어야 하므로 특수 수정자를 사용해야 합니다. 이에 대한 예는
[셀로의 모노레포](https.github.com/celo-org/celo-monorepo/blob/fff103a6b5bbdcfe1e8231c2eef20524a748ed07/packages/protocol/contracts/common/CalledByVm.sol#L3)에
서 찾을 수 있습니다.

## `FiatTokenFeeAdapter` 개요

인터페이스를 보려면 `IFiatTokenFeeAdapter`를 참조하십시오. 셀로 체인은 가스 요금
지불에 ERC-20 토큰 사용을 지원합니다. 18이 아닌 다른 소수점 필드를 가진 ERC-20
토큰의 경우 셀로 체인은
[FeeCurrencyAdapter](https://github.com/celo-org/celo-monorepo/blob/release/core-contracts/11/packages/protocol/contracts-0.8/stability/FeeCurrencyAdapter.sol)
전략을 사용하여 소수점 변환이 공정하도록 합니다. 배포된 USDC 어댑터는
[셀로의 공식 문서](https://docs.celo.org/protocol/transaction/erc20-transaction-fees#tokens-with-adapters)에
서 찾을 수 있습니다.

## 배포

`FiatTokenCeloV2_2`의 배포 프로세스는 기본 `FiatTokenV2_2`
[배포 프로세스](./../README.md)와 동일합니다. 배포 프로세스에 설명된 모든 단계를
따르되 기본 `deploy-fiat-token` 스크립트 대신 `deploy-fiat-token-celo` 스크립트
를 실행해야 합니다.

```sh
yarn forge:simulate scripts/deploy/celo/deploy-fiat-token-celo.s.sol --rpc-url <testnet 또는 mainnet>
```

`FiatTokenFeeAdapter` 배포의 경우 `.env` 파일의 필수 필드를 채워야 합니다. 즉,
`FIAT_TOKEN_CELO_PROXY_ADDRESS`, `FEE_ADAPTER_PROXY_ADMIN_ADDRESS` 및
`FEE_ADAPTER_DECIMALS`를 채워야 합니다. 그런 다음 다음 명령을 실행하여 배포하십
시오.

```sh
yarn forge:simulate scripts/deploy/celo/deploy-fee-adapter.s.sol --rpc-url <testnet 또는 mainnet>
```
