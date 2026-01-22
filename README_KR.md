<!-- prettier-ignore-start -->
<!-- omit in toc -->
# EVM 호환 블록체인용 서클 스테이블코인 스마트 계약
<!-- prettier-ignore-end -->

이 저장소에는 [Circle](https://www.circle.com/)의 스테이블코인이 EVM 호환 블록체
인에서 사용하는 스마트 계약이 포함되어 있습니다. 모든 계약은
[Solidity](https://soliditylang.org/)로 작성되었으며
[Hardhat](https://hardhat.org/) 프레임워크로 관리됩니다.

<!-- prettier-ignore-start -->
<!-- omit in toc -->
## 목차
<!-- prettier-ignore-end -->

- [설정](#설정)
  - [개발 환경](#개발-환경)
  - [IDE](#ide)
- [개발](#개발)
  - [계약에 대한 TypeScript 유형 정의 파일](#계약에-대한-typescript-유형-정의-파일)
  - [린팅 및 서식 지정](#린팅-및-서식-지정)
  - [테스트](#테스트)
- [배포](#배포)
- [계약](#계약)
- [FiatToken 기능](#fiattoken-기능)
  - [ERC20 호환](#erc20-호환)
  - [일시 중지 가능](#일시-중지-가능)
  - [업그레이드 가능](#업그레이드-가능)
  - [블랙리스트](#블랙리스트)
  - [민팅/소각](#민팅소각)
  - [소유 가능](#소유-가능)
- [추가 문서](#추가-문서)

## 설정

### 개발 환경

요구 사항:

- Node 20.9.0
- Yarn 1.22.19
- [Foundry@f625d0f](https://github.com/foundry-rs/foundry/releases/tag/nightly-f625d0fa7c51e65b4bf1e8f7931cd1c6e2e285e9)

```sh
$ nvm use
$ npm i -g yarn@1.22.19 # 아직 yarn이 없다면 설치합니다.
$ yarn install          # setup.sh에 나열된 npm 패키지 및 기타 종속성을 설치합니다.
```

### IDE

이 프로젝트에는 [확장 프로그램](./.vscode/extensions.json)이 설치된 VSCode를 사
용하는 것이 좋습니다.

## 개발

### 계약에 대한 TypeScript 유형 정의 파일

유형은 계약 컴파일의 일부로 자동 생성됩니다.

```sh
$ yarn compile
```

다시 컴파일하지 않고 타이핑을 생성하려면 다음을 실행하십시오.

```sh
$ yarn hardhat typechain
```

### 린팅 및 서식 지정

코드에 문제가 있는지 확인하려면:

```sh
$ yarn static-check   # 저장소에서 정적 검사를 실행합니다.
```

또는 개별적으로 검사를 실행합니다.

```sh
$ yarn typecheck      # TypeScript 코드 유형 검사
$ yarn lint           # JavaScript 및 TypeScript 코드 확인
$ yarn lint --fix     # 가능한 경우 문제 수정
$ yarn solhint        # Solidity 코드 확인
```

코드를 자동 서식 지정하려면:

```sh
$ yarn fmt
```

### 테스트

모든 테스트 실행:

```sh
$ yarn test
```

특정 파일에서 테스트를 실행하려면 다음을 실행하십시오.

```sh
$ yarn test [path/to/file]
```

테스트를 실행하고 테스트 커버리지를 생성하려면 다음을 실행하십시오.

```sh
$ yarn coverage
```

저장소에 있는 계약의 크기를 확인하려면 다음 명령을 실행하십시오.

```sh
$ yarn contract-size # 테스트는 무시합니다.
```

## 배포

1. `.env.example` 파일의 복사본을 만들고 `.env`로 이름을 지정합니다. `.env` 파일
   에 적절한 값을 입력합니다. 이 파일은 저장소에 체크인해서는 안 됩니다.

```sh
cp .env.example .env
```

2. `blacklist.remote.json` 파일을 만들고 블랙리스트에 추가할 주소 목록으로 채웁
   니다. 이 파일은 저장소에 체크인해서는 안 됩니다.

```sh
echo "[]" > blacklist.remote.json
```

3. 다음 명령을 실행하여 배포를 시뮬레이션합니다.

```sh
yarn forge:simulate scripts/deploy/deploy-fiat-token.s.sol --rpc-url <testnet 또는 mainnet>
```

4. 브로드캐스트할 모든 트랜잭션이 올바른 값으로 채워졌는지 확인합니다.
5. 다음 명령을 실행하여 계약을 배포합니다.

```sh
yarn forge:broadcast scripts/deploy/deploy-fiat-token.s.sol --rpc-url <testnet 또는 mainnet>
```

6. 다음 명령을 실행하여 Etherscan 플레이버 블록 탐색기에서 계약을 확인합니다.
   `.env` 파일에 `ETHERSCAN_KEY`가 설정되어 있는지 확인합니다.

```sh
yarn forge:verify scripts/deploy/deploy-fiat-token.s.sol --rpc-url <testnet 또는 mainnet>
```

## 계약

FiatToken 계약은 OpenZeppelin의
[프록시 업그레이드 패턴](https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies)([영구 링크](https://github.com/OpenZeppelin/openzeppelin-upgrades/blob/65cf285bd36af24570186ca6409341540c67238a/docs/modules/ROOT/pages/proxies.adoc#L1))
을 따릅니다. 두 가지 주요 계약이 있습니다. FiatToken의 기능에 대한 기본 논리를포
함하는 구현 계약([`FiatTokenV2_2.sol`](./contracts/v2/FiatTokenV2_2.sol))과 함수
호출을 구현 계약으로 리디렉션하는 프록시 계약
([`FiatTokenProxy.sol`](./contracts/v1/FiatTokenProxy.sol))입니다. 이를 통해
FiatToken의 기능을 업그레이드할 수 있습니다. 새 구현 계약을 배포하고 프록시가 이
를 가리키도록 업데이트할 수 있기 때문입니다.

## FiatToken 기능

FiatToken은 아래에 간략하게 설명된 여러 기능을 제공합니다. `doc` 디렉터리에 더
[자세한 디자인 문서](./doc/tokendesign.md)가 있습니다.

### ERC20 호환

FiatToken은 ERC20 인터페이스를 구현합니다.

### 일시 중지 가능

심각한 버그가 발견되거나 심각한 키 손상이 있는 경우 전체 계약을 동결할 수 있습니
다. 계약이 일시 중지된 동안에는 전송이 불가능합니다. 일시 중지 기능에 대한 액세
스는 `pauser` 주소로 제어됩니다.

### 업그레이드 가능

새 구현 계약을 배포할 수 있으며 프록시 계약은 호출을 새 계약으로 전달합니다. 업
그레이드 기능에 대한 액세스는 `proxyOwner` 주소로 보호됩니다. `proxyOwner` 주소
만 `proxyOwner` 주소를 변경할 수 있습니다.

### 블랙리스트

계약은 특정 주소를 블랙리스트에 추가하여 해당 주소가 토큰을 전송하거나 수신하는
것을 방지할 수 있습니다. 블랙리스트 기능에 대한 액세스는 `blacklister` 주소로 제
어됩니다.

### 민팅/소각

토큰은 요청 시 민팅하거나 소각할 수 있습니다. 이 계약은 여러 명의 민터를 동시에
지원합니다. 민터 목록과 각 민터가 민팅할 수 있는 양을 제어하는 `masterMinter` 주
소가 있습니다. 민팅 허용량은 ERC20 허용량과 유사합니다. 각 민터가 새 토큰을 민팅
하면 허용량이 감소합니다. 너무 낮아지면 `masterMinter`가 다시 허용량을 늘려야 합
니다.

### 소유 가능

계약에는 `owner`, `pauser`, `blacklister` 또는 `masterMinter` 주소를 변경할 수있
는 소유자가 있습니다. `owner`는 `proxyOwner` 주소를 변경할 수 없습니다.

### 브리지 USDC 표준

브리지된 USDC를 배포하려면 추가 요구 사항이 필요합니다. 자세한 지침은 일반
README 대신 [브리지 USDC 표준](./doc_kr/bridged_USDC_standard.md) 가이드를 참조
하십시오.

## 추가 문서

- [FiatToken 디자인](./doc_kr/tokendesign.md)
- [MasterMinter 디자인](./doc_kr/masterminter.md)
- [배포 프로세스](./doc_kr/deployment.md)
- [업그레이드 준비](./doc_kr/upgrade.md)
- [v2.1에서 v2.2로 업그레이드](./doc_kr/v2.2_upgrade.md)
- [Celo FiatToken 확장](./doc_kr/celo.md)
