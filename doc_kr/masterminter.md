# MasterMinter 계약

MasterMinter는 거버넌스 계약입니다. 서클 FiatToken 계약의 `masterMinter` 역할 기
능을 여러 주소에 위임합니다. (`masterMinter` 역할은 FiatToken에서 민터를 추가 및
제거하고 허용량을 설정할 수 있습니다.) MasterMinter 계약은 민터 관리 기능을
`controller`에 위임합니다. 각 `controller`는 정확히 하나의 `minter`를 관리하며,
단일 `minter`는 여러 `controller`에 의해 관리될 수 있습니다. 이를 통해 직무 분리
(오프라인 키 관리)가 가능하고 웜 트랜잭션에 대한 논스 관리가 간소화됩니다.

`masterMinter` 사용자 주소를 `MasterMinter` 계약으로 교체해도 민터 및 FiatToken
보유자는 영향을 받지 않습니다.

# 역할

`MasterMinter` 계약에는 다음과 같은 역할이 있습니다.

- `owner` - 컨트롤러를 추가 및 제거하고, `minterManager`의 주소를 설정하고, 소유
  자를 설정합니다.
- `minterManager` - `MinterManagementInterface`가 있는 계약(예: USDC)의 주소입니
  다. `minterManager` 계약은 민터 허용량 및 활성화/비활성화된 민터에 대한 정보를
  저장합니다.
- `controller` - 각 컨트롤러는 정확히 하나의 민터를 관리합니다. 컨트롤러는
  `MasterMinter` 계약의 함수를 호출하여 민터를 활성화/비활성화하고 민팅 허용량을
  수정할 수 있으며, `MasterMinter`는 `minterManager`에서 적절한 함수를 호출합니
  다.
- `minter` - 각 `minter`는 하나 이상의 `controller`에 의해 관리됩니다.
  `minter`는 MasterMinter 계약에서 어떠한 작업도 수행할 수 없습니다. FiatToken
  계약과만 상호 작용합니다.

# FiatToken 계약과의 상호 작용

FiatToken 계약의 `owner`는 `masterMinter` 역할을 `MasterMinter` 계약의 주소를 가
리키도록 설정할 수 있습니다. 이를 통해 `MasterMinter` 계약은 FiatToken 계약에서
민터 관리 함수를 호출할 수 있습니다.

- `configureMinter(minter, allowance)` - `minter`를 활성화하고 민팅 허용량을 설
  정합니다.
- `removeMinter(minter)` - `minter`를 비활성화하고 민팅 허용량을 0으로 설정합니
  다.
- `isMinter(minter)` - `minter`가 활성화된 경우 `true`를 반환하고 그렇지 않으면
  `false`를 반환합니다.
- `minterAllowance(minter)` - `minter`의 민팅 허용량을 반환합니다.

이 네 가지 함수는 함께 `MinterManagementInterface`로 정의됩니다.
`MasterMinter`에는 `MinterManagementInterface`를 구현하는 `minterManager`의 주소
가 포함되어 있습니다. `MasterMinter`는 `minterManager`를 통해 FiatToken 계약과상
호 작용합니다.

`controller`가 `MasterMinter`의 함수를 호출하면 `MasterMinter`는 `controller`를
대신하여 `FiatToken` 계약에서 적절한 함수를 호출합니다. `MasterMinter`와
`FiatToken`은 모두 자체 액세스 제어를 수행합니다.

# 함수 요약

- `configureController(controller, minter)` - 소유자는 컨트롤러를 할당하여 민터
  를 관리합니다. 이를 통해 `controller`는 `configureMinter`,
  `incrementMinterAllowance` 및 `removeMinter`를 호출할 수 있습니다. 참고:
  `configureController(controller, 0x00)`은 컨트롤러를 제거하는 효과가 있으므로
  금지됩니다.
- `removeController(controller)` - 소유자는 `minter`를 `0x00`으로 설정하여 컨트
  롤러를 비활성화합니다.
- `setMinterManager(minterManager)` - 소유자는 새 계약을 `minterManager` 주소로
  설정합니다. 이는 이전 `minterManager` 계약에 영향을 미치지 않습니다. 새
  `minterManager`가 `MinterManagementInterface`를 구현하지 않거나 이
  `MasterMinter` 계약 인스턴스에 민터 관리 함수를 호출할 수 있는 권한을 부여하지
  않으면 `controller`가 `configureMinter`, `incrementMinterAllowance` 및
  `removeMinter`를 호출할 때 예외가 발생합니다.
- `configureMinter(allowance)` - 컨트롤러는 민터를 활성화하고 허용량을 설정합니
  다. `MasterMinter` 계약은 `controller`를 대신하여 `minterManager` 계약을 호출
  합니다.
- `incrementMinterAllowance` - 컨트롤러는 <b>활성화된</b> 민터의 허용량을 증분합
  니다(`minter`가 비활성화된 경우 `incrementMinterAllowance`는 예외를 발생시킵니
  다). `MasterMinter` 계약은 `controller`를 대신하여 `minterManager` 계약을 호출
  합니다.
- `removeMinter` - 컨트롤러는 `minter`를 비활성화합니다. `MasterMinter` 계약은
  `controller`를 대신하여 `minterManager` 계약을 호출합니다.

# 배포

`MasterMinter`는 `FiatToken` 계약(예: USDC)과 독립적으로 배포될 수 있습니다.

- <b>FiatToken</b> 다음 <b>MasterMinter.</b> `MasterMinter`를 배포하고 생성자에
  서 `minterManager`가 `FiatToken`을 가리키도록 설정합니다. 그런 다음
  `MasterMinter` `owner` 역할을 사용하여 `FiatToken`의 각 기존 `minter`에 대해하
  나 이상의 `controller`를 구성합니다. `MasterMinter`가 완전히 구성되면
  `FiatToken` `owner` 역할을 사용하여 `masterMinter` 역할을 `MasterMinter` 계약
  주소로 설정하는 `updateMasterMinter` 트랜잭션을 브로드캐스트합니다.
- <b>MasterMinter</b> 다음 <b>FiatToken.</b> `MasterMinter`를 배포하고 생성자에
  서 `minterManager`가 주소 `0x00`을 가리키도록 설정합니다. 그런 다음
  `FiatToken`을 배포하고 생성자에서 `masterMinter`를 `MasterMinter` 계약의 주소
  로 설정합니다. 다음으로 `MasterMinter` `owner`를 사용하여 `minterManager`를 설
  정하고 `controller`를 구성합니다.

# MasterMinter 구성

각 `minter`에 대해 최소 <b>두 개</b>의 `controller`를 할당하는 것이 좋습니다.

- <b>AllowanceController.</b> 이 `controller`를 사용하여 단일 `configureMinter`
  트랜잭션으로 `minter`를 활성화한 다음 `incrementMinterAllowance` 트랜잭션에 서
  명하는 데 독점적으로 사용합니다. 크기가 다른 허용량 증분 트랜잭션에 서명하는여
  러 `AllowanceController`가 있을 수 있습니다.
- <b>SecurityController.</b> 이 `controller`를 사용하여 단일 `removeMinter` 트랜
  잭션에 서명하고 비상 사태에 대비하여 저장합니다.

이 구성을 사용하면 `SecurityController`에 대한 논스가 결정적이므로
`removeMinter` 트랜잭션을 미리 서명할 수 있으므로 문제가 발생했을 때 대응하는 시
간을 줄일 수 있습니다. `removeMinter` 트랜잭션을 브로드캐스트하면
`AllowanceController`의 모든 향후 상호 작용이 `throw`됩니다.

# MasterMinter 대 MintController

변경 사항 없이 `MintController` 계약에서 *상속*하는 `MasterMinter` 계약을 만드는
것은 이상한 디자인 선택처럼 보일 수 있습니다. 이는 기능이 다르기 때문에 이름 혼
동을 일으키지 않고 `MintController`에서 상속하는 다른 계약을 만들 가능성을 열어
둡니다.
