# FiatToken 업그레이드

이 문서는 업그레이드된 토큰을 생성하고, 업그레이드된 토큰을 배포하고, 기존 프록
시가 업그레이드된 토큰을 가리키도록 하는 프로세스입니다.

## 업그레이드된 토큰 구성

업그레이드된 토큰은 다음을 가질 수 있습니다.

1. 새로운 로직(함수)
2. 새로운 상태 변수(데이터)
3. 새로운 로직과 새로운 상태 변수
4. 이름이 변경된 상태 변수
5. 기존 함수에 대한 업데이트된 로직

각 상황은 아래 섹션에서 다룹니다.

> **_중요_**: 기존 상태 변수를 제거하거나 계약의 상속 순서를 수정하지 마십시오.
> 계약 상태에 대한 스토리지 주소는 컴파일 중에 정의되며 상태 변수 선언에 따라 순
> 차적인 순서를 따릅니다. 상태 변수를 제거하면 다른 변수가 잘못된 스토리지 주소
> 에서 읽기/쓰기를 유발할 수 있으므로 위험합니다.
>
> 스토리지 슬롯으로 작업할 때는 주의하십시오. 업그레이드하기 전에 기존 상태 변수
> 의 스토리지 주소가 변경되지 않았는지 확인하십시오. 이 동작을 확인하기 위해
> [storageSlots.behavior.ts](../test/helpers/storageSlots.behavior.ts)를 사용할
> 수 있습니다.

### 새로운 로직만

새로운 로직을 위한 다음 업그레이드된 계약의 템플릿은 /contracts에 파일 이름
FiatTokenV[X].sol(여기서 X는 버전 번호)로 유지됩니다. 업그레이드된 계약은 현재계
약에서 상속해야 _합니다_. 예를 들어 버전 1에서 버전 2로 업그레이드하는 경우 계약
은 다음과 같은 형식을 갖습니다.

```solidity
import './FiatTokenV1.sol';

/**
 \* @title FiatTokenV2
 \* @dev ERC20 Token backed by fiat reserves
 **/
contract FiatTokenV2 is FiatTokenV1 {
  ...
}

```

남은 것은 계약 본문(위 코드에서 ...로 표시)의 일부로 새로운 로직(함수)을 추가하
는 것뿐입니다. `private` *함수*는 후속 계약 버전에서 상속되지 않으므로 주의해서
추가해야 합니다.

### 새로운 상태 변수만

새로운 상태 변수를 추가하려면 [새로운 로직](#새로운-로직만)에서 수행한 것처럼 계
약의 이전 버전에서 상속해야 합니다. 또한 새 계약은 새 상태 변수를 선언해야 하며,
상태 변수를 기본값이 아닌 값으로 초기화해야 하는 경우 새 상태 변수에 대한 초기화
로직을 추가해야 합니다. 새로 추가된 변수는 `internal` 또는 `public` 유형으로 선
언해야 _하며_, `private`은 절대 사용할 수 없습니다. `private` *함수*도 후속 계약
버전에서 상속되지 않으므로 주의해서 추가해야 합니다. 또한 프록시가 이 코드를 실
행하지 않기 때문에 선언의 일부로 변수를 인라인으로 초기화하는 것은 효과가 없습니
다(예: bool public newBool = true는 실제로 true로 초기화되지 않음). 가능하다면기
본 Solidity 값으로 시작할 수 있고 초기화가 필요 없는 새 상태 변수를 추가해야합니
다. 그러나 새 상태 변수가 기본값이 아닌 값으로 초기화해야 하는 경우 새 토큰은
_initialize_ 함수와 _initV[X]_ 함수(여기서 X는 계약 버전)를 추가해야 합니다. 초
기화 함수를 사용하면 계약을 처음부터 배포하고 새 계약과 이전 계약에 선언된 모든
변수를 초기화할 수 있습니다. initV[X] 함수를 사용하면 새 계약에 추가된 새 변수만
초기화할 수 있습니다. 아래는 버전 1에서 버전 2로 업그레이드하는 템플릿입니다. 이
예에서는 추가된 실제 변수로 대체될 newBool, newAddress 및 newUint 변수를추가합니
다.

```solidity
import './FiatTokenV1.sol';

/**
 \* @title FiatTokenV2
 \* @dev ERC20 Token backed by fiat reserves
 **/
contract FiatTokenV2 is FiatTokenV1 {

  bool public newBool;
  address public newAddress;
  uint256 public newUint;
  bool internal initializedV2;

  function initialize(
      string _name,
      string _symbol,
      string _currency,
      uint8 _decimals,
      address _masterMinter,
      address _pauser,
      address _blacklister,
      address _owner,
      bool _newBool,
      address _newAddress,
      uint256 _newUint
  ) public {
      super.initialize(_name, _symbol, _currency, _decimals, _masterMinter, _pauser, _blacklister, _owner);
      initV2(_newBool, _newAddress, _newUint);
  }

  function initV2(bool _newBool, address _newAddress, uint256 _newUint) public {
      require(!initializedV2);
      newBool = _newBool;
      newAddress = _newAddress;
      newUint = _newUint;
      initializedV2 = true;
  }
  ...

```

_initV[X]에서 확인하고 설정하는 새로운 initializedV[X] 변수의 추가에 유의하십시
오._ _이전에 설정된 매개변수와 함께 슈퍼 호출을 사용하는 초기화된 구조와
initV[X] 호출에 유의하십시오._

### 새로운 로직 및 새로운 상태 변수

이 경우는 [새로운 상태 변수만](#새로운-상태-변수만)과 동일한 단계와
[새로운 로직](#새로운-로직만)에서 수행한 것처럼 새 함수를 추가해야 합니다.

### 업데이트된 로직

기존 함수의 로직은 업데이트될 수 있지만, 계약 사용자에게 주요 변경 사항을 유발하
지 않고 절대적으로 필요한 경우에만 수행해야 합니다. 이는 기존 계약에서 함수 선언
을 찾고 함수를 `virtual`로 표시하고 업그레이드된 계약에서 함수를 `override`하여
수행할 수 있습니다.

```solidity
contract FiatTokenV1 {
    ...

    function foo() external virtual pure returns (uint256) {
        return 1;
    }
}
```

```solidity
import './FiatTokenV1.sol';

/**
 \* @title FiatTokenV2
 \* @dev ERC20 Token backed by fiat reserves
 **/
contract FiatTokenV2 is FiatTokenV1 {
    ...

    function foo() external override pure returns (uint256) {
        return 2;
    }
}
```

### 이름이 변경된 상태 변수

명확성이나 가독성을 높이기 위해 상태 변수의 이름을 바꿀 수 있습니다. 이는 사용되
지 않게 되었지만 안전하게 제거할 수 없는 상태 변수가 있는 경우 유용할 수 있습니
다. 변수를 더 이상 사용하지 않도록 하려면 기존 계약에서 변수 선언을 찾고 변수 앞
에 `deprecated`를 붙이고 변수에 대한 참조를 새 이름으로 바꾸면 됩니다.

## 업그레이드된 토큰 배포

배포는 다음 단계로 수행할 수 있습니다.

1. 새 계약에 새 로직과 새 상태 변수를 작성합니다(위에 설명된 대로).
2. 계약에 추가된 새 상태 변수 및 로직을 테스트합니다(현재 테스트 전략에 따라 긍
   정, 부정 및 확장 테스트 포함).
3. 테스트 스위트가 추가된 테스트와 함께 새 계약의 최종 버전에서 실행되었고 테스
   트 스위트가 100% 코드 커버리지로 통과하는지 확인합니다.
4. 필요하다고 판단되는 외부 감사를 완료합니다.
5. 이전 단계가 성공적으로 완료되지 않은 경우 1단계로 돌아갑니다.
6. *배포 지침*의 _구현 계약 배포_ 섹
   션[지침](deployment.md#Deploying-the-implementation-contract)만 따라 계약을배
   포합니다. 배포 지침에 따라 `initialize`를 호출할 때 최신 버전의
   `initialize`를 호출해야 합니다.

## 업그레이드된 토큰을 가리키도록 프록시 업그레이드

프록시는 새롭게 업그레이드된 토큰을 가리켜야 합니다. 이는 새로운 로직만 추가되었
는지 또는 새로운 상태 변수(그리고 아마도 새로운 로직)가 추가되었는지에 따라 두가
지 방식으로 수행됩니다.

### _오직_ 새로운 로직만 추가된 경우 업그레이드

1. 새롭게 업그레이드된 토큰의 주소로 매개변수화된 adminAccount에서 upgradeTo 트
   랜잭션을 준비합니다.
2. 트랜잭션을 브로드캐스트합니다.
3. `implementation` 메서드를 호출하여 프록시의 구현 필드가 업그레이드된 토큰의주
   소와 일치하는지 확인합니다.
4. 3)의 주소가 일치하지 않으면 잘못된 주소가 사용되었을 가능성이 높습니다. 1)단
   계부터 프로세스를 반복합니다.

### 새로운 상태 변수(그리고 아마도 새로운 로직)가 추가된 경우 업그레이드

1. 새롭게 업그레이드된 토큰의 주소와 새로운 데이터 상태 변수로 initV[X]를 호출하
   는 내부 호출로 매개변수화된 adminAccount에서 upgradeToAndCall 트랜잭션을 준비
   합니다.
2. 트랜잭션을 브로드캐스트합니다.
3. `implementation` 메서드를 호출하여 프록시의 구현 필드가 업그레이드된 토큰의주
   소와 일치하는지 확인합니다.
4. 3)의 주소가 일치하지 않으면 잘못된 주소가 사용되었을 가능성이 높습니다. 1)단
   계부터 프로세스를 반복합니다.
5. _배포 지침_ [확인](deployment.md)에서 수행한 대로 새로운 상태 변수가 올바르게
   설정되었는지 확인합니다.
6. 확인에 실패하면 1)단계부터 프로세스를 다시 시작합니다.
