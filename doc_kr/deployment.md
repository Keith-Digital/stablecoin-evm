# 초기 배포

이것은 새로운 프록시 및 구현을 배포하는 프로세스입니다 (기존 프록시를 업그레이드
하는 것과 반대).

프록시는 `delegatecall`을 사용하여 구현으로 호출을 전달하므로 생성자를 통해 구현
계약의 필드를 초기화할 수 없기 때문에 계약 초기화가 약간 까다로워집니다. 대신 구
현 계약에는 공개적으로 사용할 수 있지만 프록시당 한 번만 호출할 수 있는 초기화메
서드가 있습니다.

## 구현 계약 배포

1. [FiatTokenV2_2](../contracts/v2/FiatTokenV2_2.sol) 배포
2. `initialize*` 메서드를 통해 FiatTokenV2_2의 필드를 초기화합니다. 값은 중요하
   지 않지만 이렇게 하면 다른 사람이 역할을 초기화하고 토큰으로 사용하거나 실제
   서클 토큰으로 위장하는 것을 막을 수 있습니다.

   ```js
   initialize(
     "",
     "",
     "",
     0,
     THROWAWAY_ADDRESS,
     THROWAWAY_ADDRESS,
     THROWAWAY_ADDRESS,
     THROWAWAY_ADDRESS
   );
   initializeV2("");
   initializeV2_1(THROWAWAY_ADDRESS);
   initializeV2_2([], "");
   ```

3. FiatToken의 모든 필드가 올바르게 초기화되었고 예상 값을 가지고 있는지 확인합
   니다.

## 프록시 배포:

1. 다음 계약 역할에 대한 주소를 얻습니다. 이러한 주소에 대한 키가 안전하게 저장
   되었는지 확인하십시오.

   ```
   admin
   masterMinter
   pauser
   blacklister
   owner
   ```

   이러한 역할이 할 수 있는 일에 대한 자세한 내용은
   [토큰 디자인 문서](tokendesign.md)를 참조하십시오.

2. [FiatTokenProxy](../contracts/v1/FiatTokenProxy.sol)를 배포하고 배포된 구현계
   약의 주소를 생성자에 전달하여 `_implementation` 필드를 초기화합니다.

3. 프록시 계약의 `admin`은 기본적으로 `msg.sender`입니다. 지금 `admin`을 변경하
   거나 다른 주소에서 나머지 트랜잭션을 보내야 합니다. `admin`은 프록시의 메서드
   만 볼 수 있으며 `admin`의 모든 메서드 호출은 구현 계약으로 전달되지 않습니다.
   `admin` 주소는 `changeAdmin`을 호출하여 변경할 수 있습니다. `changeAdmin`은현
   재 관리자가 호출해야 합니다.

   ```
   changeAdmin(adminAddress)
   ```

4. `initialize*` 메서드를 통해 프록시를 초기화합니다. 이 호출은 구현 계약으로 전
   달되지만 `delegatecall`을 통해 실행되므로 프록시 계약의 컨텍스트에서 실행되므
   로 초기화하는 필드는 프록시의 스토리지에 저장됩니다. 여기에 전달된 값은 특히
   계약을 제어할 역할에 대해 중요합니다.

   ```js
   initialize(
     tokenName,
     tokenSymbol,
     tokenCurrency,
     tokenDecimals,
     masterMinterAddress,
     pauserAddress,
     blacklisterAddress,
     ownerAddress
   );
   initializeV2(newTokenName);
   initializeV2_1(lostAndFoundAddress);
   initializeV2_2(accountsToBlacklist, newTokenSymbol);
   ```

5. 필드가 올바르게 초기화되었는지 확인합니다. 계약이 올바르게 배포되었는지 확인
   하기 위해 여러 사람이 독립적으로 확인을 수행해야 합니다. 다음 필드를 확인해야
   합니다.

   - `admin`이 예상 주소입니다.
   - `implementation`은 구현 계약의 주소입니다.
   - `name`, `symbol`, `currency` 및 `decimals`가 예상대로입니다.
   - `version`은 2입니다.
   - `owner`, `masterMinter`, `pauser`, `blacklister`가 예상 주소입니다.
   - `totalSupply`는 0입니다.
   - `initialized`는 `true`입니다.

6. 모든 확인이 성공하면 계약이 배포되고 사용할 준비가 된 것입니다. 확인 단계가실
   패하면 프로세스를 다시 시작하십시오.
