# FiatToken 컨트랙트 계층 구조 문서

FiatToken 시스템은 업그레이드 가능한 프록시 패턴을 사용하여 설계되었습니다. 이는
사용자 상호작용 지점(프록시)과 실제 토큰 로직(구현)을 분리하여, 토큰의 핵심 로직
을 안전하게 업그레이드할 수 있도록 합니다.

## 1. 개요 (Overview)

- **프록시 (Proxy):** 사용자와 직접 상호작용하는 진입점입니다. 이 컨트랙트는 실
  제 토큰 로직이 구현된 컨트랙트(구현 컨트랙트)로 모든 호출을 위임합니다. 이를통
  해 구현 컨트랙트의 변경(업그레이드)이 사용자에게 투명하게 이루어집니다.
- **구현 (Implementation):** 토큰의 실제 기능(발행, 전송, 소각 등)이 정의된 컨트
  랙트입니다. 여러 버전의 구현 컨트랙트가 상속을 통해 기능을 확장하며, 프록시가
  항상 최신 구현 컨트랙트를 가리키도록 관리됩니다.

```
(사용자)
   │
   ▼
┌──────────────────┐
│ FiatTokenProxy   │  <-- 사용자가 상호작용하는 주소
└──────────────────┘
   │ (호출 위임 - delegates to)
   ▼
┌──────────────────┐
│ FiatTokenV2_2    │  <-- 현재 배포된 최신 토큰 로직 구현체
└──────────────────┘
```

## 2. 컨트랙트 상속 계층 (Contract Inheritance Hierarchy)

### 2.1. 프록시 컨트랙트 계층

프록시 컨트랙트는 `Proxy`의 기본 기능을 시작으로 점진적으로 업그레이드 및 관리기
능을 추가합니다.

- **`Proxy`**:
  - 다른 컨트랙트로 호출을 위임하는 가장 기본적인 프록시 로직을 제공합니다.
- **`UpgradeabilityProxy`**:
  - `Proxy`를 상속받습니다.
  - 실제 로직이 담긴 구현 컨트랙트의 주소를 변경(업그레이드)할 수 있는 기능을 추
    가합니다.
- **`AdminUpgradeabilityProxy`**:
  - `UpgradeabilityProxy`를 상속받습니다.
  - 업그레이드 및 특정 관리 작업(예: `changeAdmin`, `upgradeTo`)을 수행할 수 있
    는 "관리자(admin)" 계정을 지정하고 관리하는 기능을 추가합니다.
  - 관리자 외의 호출자가 관리자 전용 함수를 호출하거나, 관리자가 토큰 로직 함수
    를 직접 호출할 경우 특정 오류를 발생시키는 로직(`_willFallback` 함수 내
    `require` 구문)을 포함합니다.
- **`FiatTokenProxy`**:
  - `AdminUpgradeabilityProxy`를 상속받는 최종 프록시 컨트랙트입니다.
  - `FiatToken` 시스템에서 사용자 상호작용의 단일 진입점으로 사용됩니다.

**계층 시각화:**

```
Proxy
 └── UpgradeabilityProxy
      └── AdminUpgradeabilityProxy
           └── FiatTokenProxy
```

### 2.2. 구현 컨트랙트 계층

구현 컨트랙트는 ERC20 표준을 시작으로, FiatToken의 특정 기능(민팅, 소각, 블랙리
스트, 권한부여 등)을 버전별로 확장하며 구현합니다.

- **`IERC20` (OpenZeppelin)**:
  - ERC20 토큰 표준 인터페이스를 정의합니다. `totalSupply()`, `balanceOf()`,
    `transfer()`, `approve()`, `allowance()`, `transferFrom()` 등의 기본 함수 시
    그니처를 포함합니다.
- **`AbstractFiatTokenV1`**:
  - `IERC20`를 상속받는 추상 컨트랙트입니다.
  - `_approve` 및 `_transfer`와 같은 내부 ERC20 관련 로직의 가상 함수를 정의합니
    다.
- **`FiatTokenV1`**:
  - `AbstractFiatTokenV1`, `Ownable`, `Pausable`, `Blacklistable`을 상속받습니다
    .
  - **핵심 토큰 로직:** 토큰의 이름, 심볼, 소수점, 통화, 총 공급량 등을 관리합니
    다.
  - **민팅/소각:** 토큰의 발행(`mint`) 및 소각(`burn`) 기능을 제공합니다.
    `MasterMinter` 및 `Minter` 역할을 도입합니다.
  - **접근 제어:** `Ownable` (소유자 기반 접근 제어), `Pausable` (일시 정지/재개
    기능), `Blacklistable` (블랙리스트 기능)을 통해 토큰의 관리 기능을 구현합니
    다.
  - **초기화:** `initialize` 함수를 통해 컨트랙트의 초기 상태를 설정합니다.
- **`FiatTokenV1_1`**:
  - `FiatTokenV1`과 `Rescuable`을 상속받습니다.
  - **자산 복구:** `Rescuable` 기능을 통해 실수로 컨트랙트 주소로 전송된 ERC20
    토큰을 복구할 수 있는 기능을 추가합니다.
- **`FiatTokenV2`**:
  - `FiatTokenV1_1`, `EIP3009`, `EIP2612`를 상속받습니다.
  - **EIP-3009 (TransferWithAuthorization):** 서명된 권한(authorization)을 통해
    토큰 전송을 수행하는 기능을 도입하여, 가스비 없이 오프체인 서명으로 트랜잭션
    을 승인할 수 있도록 합니다.
  - **EIP-2612 (Permit):** 서명된 `permit` 기능을 통해 `approve` 호출 없이 바로
    `transferFrom`을 실행할 수 있도록 합니다.
  - **V2 초기화:** `initializeV2` 함수를 통해 V2 관련 초기화를 수행합니다.
- **`FiatTokenV2_1`**:
  - `FiatTokenV2`를 상속받습니다.
  - **V2.1 초기화:** `initializeV2_1` 함수를 통해 특정 주소로 잠긴 토큰을 전송하
    고 컨트랙트 자신을 블랙리스트에 추가하는 등의 V2.1 관련 초기화 로직을 포함합
    니다.
- **`FiatTokenV2_2`**:
  - `FiatTokenV2_1`을 상속받는 현재 시스템의 최신 구현 컨트랙트입니다.
  - 이 컨트랙트는 `FiatToken`이 제공하는 모든 기능의 최신 버전을 담고 있습니다.

**계층 시각화:**

```
                                      IERC20 (from OpenZeppelin)
                                             │
                                             ▼
                                      AbstractFiatTokenV1
                                             │
                                             ▼
                          ┌─────────────────────────────────────────────────────────┐
                          │ FiatTokenV1                                             │
                          │   + Ownable (접근 제어)                                 │
                          │   + Pausable (일시정지/재개)                            │
                          │   + Blacklistable (블랙리스트)                          │
                          └─────────────────────────────────────────────────────────┘
                                             │
                                             ▼
                          ┌─────────────────────────────────────────────────────────┐
                          │ FiatTokenV1_1                                           │
                          │   + Rescuable (자산 복구)                               │
                          └─────────────────────────────────────────────────────────┘
                                             │
                                             ▼
                          ┌─────────────────────────────────────────────────────────┐
                          │ FiatTokenV2                                             │
                          │   + EIP3009 (TransferWithAuthorization)                 │
                          │   + EIP2612 (Permit)                                    │
                          └─────────────────────────────────────────────────────────┘
                                             │
                                             ▼
                                      FiatTokenV2_1
                                             │
                                             ▼
                                      FiatTokenV2_2 (최신 구현)
```
