# 서클의 FiatToken 디자인

서클의 FiatToken 계약은 ERC-20 호환 토큰입니다. 여러 엔티티가 토큰을 발행/소각하
고, 모든 활동을 일시 중지하고, 개별 주소를 동결하고, 버그를 수정하거나 기능을 추
가할 수 있도록 계약을 업그레이드할 수 있습니다.

## 역할

`FiatToken`에는 다양한 기능을 제어하는 여러 역할(주소)이 있습니다.

- `masterMinter` - 민터를 추가 및 제거하고 민팅 허용량을 늘립니다.
- `minters` - 토큰을 생성하고 소멸시킵니다.
- `pauser` - 계약을 일시 중지하여 모든 전송, 발행 및 소각을 방지합니다.
- `blacklister` - 특정 주소와의 모든 전송을 방지하고 해당 주소가 발행 또는 소각
  하는 것을 방지합니다.
- `owner` - `admin`을 제외한 모든 역할을 재할당합니다.
- `admin` - 구현 계약 전환과 같은 프록시 수준 기능을 관리합니다.
- `rescuer` - 계약에 잠긴 모든 ERC-20 토큰을 전송합니다.

서클은 모든 역할의 주소를 제어합니다.

## ERC-20

`FiatToken`은 몇 가지 변경 사항과 함께 ERC-20 인터페이스의 표준 메서드를 구현합
니다.

- 블랙리스트에 오른 주소는 `transfer` 또는 `transferFrom`을 호출할 수 없으며 토
  큰을 받을 수 없습니다.
  - FiatToken 버전 <2.2에서는 블랙리스트에 오른 주소에 대해 `approve`가 허용되지
    않았지만 버전 2.2 이상에서는 사용할 수 있습니다. 자세한 내용은
    ["블랙리스팅"](#블랙리스팅) 섹션을 참조하십시오.
- 계약이 일시 중지된 경우 `transfer`, `transferFrom` 및 `approve`가 실패합니다.

## 토큰 발행 및 소멸

FiatToken 계약을 통해 여러 엔티티가 토큰을 생성하고 소멸시킬 수 있습니다. 이러한
엔티티는 서클의 회원이어야 하며 새 토큰을 생성하기 전에 서클의 심사를 받게 됩니
다.

각 `minter`는 서클이 구성하는 `minterAllowance`를 갖습니다. `minterAllowance`는
해당 민터가 발행할 수 있는 토큰의 수이며, `minter`가 토큰을 발행함에 따라
`minterAllowance`가 감소합니다. 서클은 `minter`가 서클과 양호한 관계를 유지하고
발행한 토큰에 대해 적절한 준비금을 유지하는 한 `minterAllowance`를 주기적으로 재
설정합니다. `minterAllowance`는 특정 `minter`가 손상될 경우 피해를 제한하기 위한
것입니다.

### 민터 추가

서클은 `configureMinter` 메서드를 통해 민터를 추가합니다. 민터가 구성될 때
`minterAllowance`가 지정되며, 이는 해당 주소가 발행할 수 있는 토큰의 수입니다.
`minter`가 토큰을 발행함에 따라 `minterAllowance`는 감소합니다.

- `masterMinter` 역할만 configureMinter를 호출할 수 있습니다.

### 발행 허용량 재설정

`minters`는 계속 발행하려면 주기적으로 허용량을 재설정해야 합니다. `minter`의 허
용량이 낮으면 서클은 `configureMinter`를 다시 호출하여 `minterAllowance`를 더 높
은 값으로 재설정할 수 있습니다.

### 민터 제거

서클은 `removeMinter` 메서드를 통해 민터를 제거합니다. 이렇게 하면 `minter`가
`minters` 목록에서 제거되고 `minterAllowance`가 0으로 설정됩니다. `minter`가 제
거되면 더 이상 토큰을 발행하거나 소각할 수 없습니다.

- `masterMinter` 역할만 `removeMinter`를 호출할 수 있습니다.

### 발행

`minter`는 `mint` 메서드를 통해 토큰을 발행합니다. `minter`는 생성할 토큰의
`amount`와 새로 생성된 토큰을 소유할 `_to` 주소를 지정합니다. `minter`는
`minterAllowance`보다 작거나 같은 금액만 발행할 수 있습니다. `minterAllowance`는
발행된 토큰의 양만큼 감소하고 `_to` 주소와 `totalSupply`의 잔액은 각각
`amount`만큼 증가합니다.

- `minter`만 `mint`를 호출할 수 있습니다.

- 계약이 `paused` 상태일 때 발행이 실패합니다.
- `minter` 또는 `_to` 주소가 블랙리스트에 오른 경우 발행이 실패합니다.
- 발행은 `Mint(minter, _to, amount)` 이벤트와 `Transfer(0x00, _to, amount)` 이벤
  트를 내보냅니다.

### 소각

`minter`는 `burn` 메서드를 통해 토큰을 소각합니다. `minter`는 소각할 토큰의
`amount`를 지정하며, `minter`는 `amount`보다 크거나 같은 `balance`를 가져야 합니
다. 최종 사용자의 우발적인 토큰 소각을 방지하기 위해 토큰 소각은 `minter` 주소로
제한됩니다. `minterAllowance`가 0인 `minter`는 토큰을 소각할 수 있습니다.
`minter`는 자신이 소유한 토큰만 소각할 수 있습니다. 민터가 토큰을 소각하면 잔액
과 totalSupply가 `amount`만큼 감소합니다.

토큰을 소각해도 소각하는 주소의 minterAllowance는 증가하지 않습니다.

- 민터만 소각을 호출할 수 있습니다.

- 계약이 일시 중지되면 소각이 실패합니다.
- 민터가 블랙리스트에 오르면 소각이 실패합니다.

- 소각은 `Burn(minter, amount)` 이벤트와 `Transfer(minter, 0x00, amount)` 이벤트
  를 내보냅니다.

## 블랙리스팅

주소를 블랙리스트에 추가할 수 있습니다. 블랙리스트에 오른 주소는 토큰을 전송하거
나, 발행하거나, 소각할 수 없습니다.

FiatToken 버전 <2.2에서는 블랙리스트에 오른 주소가 `approve`,
`increaseAllowance`, `decreaseAllowance`를 호출하거나 `permit`을 사용하여 향후풀
결제를 승인할 수 없습니다. 또한 다른 주소에서 풀 결제를 승인받을 수도 없습니다.
이는 v2.2에서 변경되어 블랙리스트에 오른 주소가 위의 기능을 수행할 수 있게되었습
니다. 그러나 자산을 어떤 방식으로든 전송하는 것은 여전히 차단됩니다. 따라서 블랙
리스트에 오른 주소의 허용량을 수정하는 모든 작업은 의미 없는 것으로 간주됩니다.

### 블랙리스트 주소 추가

서클은 `blacklist` 메서드를 통해 주소를 블랙리스트에 추가합니다. 지정된
`account`가 블랙리스트에 추가됩니다.

- `blacklister` 역할만 `blacklist`를 호출할 수 있습니다.
- 블랙리스팅은 `Blacklist(account)` 이벤트를 내보냅니다.

### 블랙리스트 주소 제거

서클은 `unblacklist` 메서드를 통해 블랙리스트에서 주소를 제거합니다. 지정된
`account`가 블랙리스트에서 제거됩니다.

- `blacklister` 역할만 `unblacklist`를 호출할 수 있습니다.
- 블랙리스트 해제는 `UnBlacklist(account)` 이벤트를 내보냅니다.

## 일시 중지

심각한 버그가 발견되거나 심각한 키 손상이 발생할 경우 전체 계약을 일시 중지할 수
있습니다. 계약이 일시 중지된 동안 모든 전송, 발행, 소각 및 민터 추가가 방지됩니
다. 블랙리스트 수정, 민터 제거, 역할 변경 및 업그레이드와 같은 다른 기능은 서클
이 계약을 일시 중지하게 만든 문제를 해결하거나 완화하는 데 필요할 수 있으므로 계
속 작동합니다.

### 일시 중지

서클은 `pause` 메서드를 통해 계약을 일시 중지합니다. 이 메서드는 일시 중지 플래
그를 true로 설정합니다.

- `pauser` 역할만 pause를 호출할 수 있습니다.

- 일시 중지는 `Pause()` 이벤트를 내보냅니다.

### 일시 중지 해제

서클은 `unpause` 메서드를 통해 계약을 일시 중지 해제합니다. 이 메서드는 `paused`
플래그를 false로 설정합니다. 계약이 일시 중지 해제되면 모든 기능이 복원됩니다.

- `pauser` 역할만 unpause를 호출할 수 있습니다.

- 일시 중지 해제는 `Unpause()` 이벤트를 내보냅니다.

## 메타 트랜잭션 호환성

### ERC-2612

이 계약은 [ERC-2612](https://eips.ethereum.org/EIPS/eip-2612)와 호환됩니다. 사용
자는 직접 트랜잭션을 제출하는 대신 `permit` 메시지에 서명하고 서명된 메시지를 온
체인 트랜잭션을 실행할 릴레이어에게 전달하여 ERC-20 허용량을 업데이트할 수 있습
니다.

### ERC-3009

이 계약은 [ERC-3009](https://eips.ethereum.org/EIPS/eip-3009)와 호환됩니다. 사용
자는 직접 트랜잭션을 제출하는 대신 EIP-3009 승인에 서명하고 승인을 온체인에서 승
인을 실행할 릴레이어에게 전달하여 다른 사용자에게 자산을 이전할 수 있습니다.

### 서명 확인 체계

이 계약은 다음을 통해 서명 확인을 지원합니다.

1. 외부 소유 계정(EOA)에 대한 ECDSA 서명
2. ERC-1271 호환 스마트 계약 지갑에 대한
   [ERC-1271](https://eips.ethereum.org/EIPS/eip-1271)

## 업그레이드

FiatTokenProxy 계약은 zeppelinos 비정형 스토리지 프록시 패턴
[https://github.com/zeppelinos/zos-lib/blob/8a16ef3ad17ec7430e3a9d2b5e3f39b8204f8c8d/contracts/upgradeability/AdminUpgradeabilityProxy.sol]을
사용합니다. [FiatTokenV2_2.sol](../contracts/v2/FiatTokenV2_2.sol)은 구현이며,
실제 토큰은 모든 호출을 delegatecall을 통해 `FiatToken`으로 전달하는 프록시 계약
([FiatTokenProxy.sol](../contracts/v1/FiatTokenProxy.sol))이 됩니다. 이 패턴을통
해 서클은 배포된 모든 토큰의 논리를 원활하게 업그레이드할 수 있습니다.

- 서클은 새 버전에 초기화가 필요한 경우 `upgradeTo` 또는 `upgradeToAndCall` 호출
  을 통해 토큰을 업그레이드합니다.
- `admin` 역할만 `upgradeTo` 또는 `upgradeToAndCall`을 호출할 수 있습니다.

## 역할 재할당

위에 설명된 역할은 재할당될 수 있습니다. `owner` 역할은 `admin` 역할을 제외한 모
든 역할(자신 포함)을 재할당할 수 있습니다.

### 관리자

- `changeAdmin`은 `admin` 역할을 새 주소로 업데이트합니다.
- `changeAdmin`은 `admin` 역할만 호출할 수 있습니다.

### 마스터 민터

- `updateMasterMinter`는 `masterMinter` 역할을 새 주소로 업데이트합니다.
- `updateMasterMinter`는 `owner` 역할만 호출할 수 있습니다.

### 일시 중지자

- `updatePauser`는 `pauser` 역할을 새 주소로 업데이트합니다.
- `updatePauser`는 `owner` 역할만 호출할 수 있습니다.

### 블랙리스터

- `updateBlacklister`는 `blacklister` 역할을 새 주소로 업데이트합니다.
- `updateBlacklister`는 `owner` 역할만 호출할 수 있습니다.

### 소유자

- `transferOwnership`은 `owner` 역할을 새 주소로 업데이트합니다.
- `transferOwnership`은 `owner` 역할만 호출할 수 있습니다.

### 구조자

- `updateRescuer`는 `rescuer` 역할을 새 주소로 업데이트합니다.
- `updateRescuer`는 `owner` 역할만 호출할 수 있습니다.
