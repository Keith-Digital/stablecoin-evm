# 브리지된 자산 자동 검증

이 문서는 브리지된 토큰 배포를 위한 바이트코드 검증 자동화 워크플로 사용에 대한
단계별 가이드입니다. 또한 성공적인 검증에 실패한 일반적인 실수와 해결 방법에 대
해서도 설명합니다.

## 설정

1. Circle의 저장소 최신 버전을 복제하고 [여기](../README.md)의 지침에 따라 설정
   합니다.

2. 다음 명령을 실행하여
   [템플릿](../verification_artifacts/input.template.json)을 복사합니다.

   ```sh
   $ cp verification_artifacts/input.template.json verification_artifacts/input.json
   ```

## 입력 제공

파일을 채우는 방법에 대한 아래 지침을 따르십시오. 최신 FiatToken 구현 계약(작성
시점 기준 FiatTokenV2_2), FiatTokenProxy 및 SignatureChecker 라이브러리 계약에대
한 입력을 한 번에 모두 제공해야 합니다.

1. 생성한 `input.json` 파일을 채웁니다. 각 계약에 대해 필수 필드는 다음과 같습니
   다.

   - `contractAddress`
   - `contractCreationTxHash`

   또한 다음 필드에 표준 EVM 호환 노드 URL을 제공해야 합니다.

   - `rpcUrl`

   각 계약에는 필요한 매개변수만으로는 계약을 확인할 수 없는 경우에만 사용해야하
   는 추가 선택적 매개변수가 있습니다. 각 선택적 매개변수의 목적은 다음과 같습니
   다.

   - `verificationType`: 기본적으로 확인 유형은 "partial"입니다. 즉, 런타임 바이
     트코드 끝에 있는 메타데이터 해시는 아래에서 생성된 메타데이터 파일을 통해별
     도로 확인됩니다. 또는 이 필드를 "full"로 설정할 수도 있지만 이 경우 계약의
     메타데이터가 이 저장소의 메타데이터와 정확히 일치해야 합니다. 이 매개변수가
     "full"로 설정된 경우 2단계에 설명된 메타데이터 추출을 건너뛸 수 있습니다.
   - `useTracesForCreationBytecode`: 계약 생성 코드를 가져오기 위해 추적을 사용
     할지 여부를 나타내는 부울 값입니다. 이 매개변수를 `true`로 설정하는 것은 계
     약이 트랜잭션 내에서 배포된 경우, 즉 다른 계약에서 배포된 경우에만 필요합니
     다. 이 매개변수가 `true`로 설정된 경우 제공된 `rpcUrl`은
     `debug_traceTransaction` JSON RPC 메서드를 지원해야 합니다.
   - `artifactType`: 계약 배포가 저장소의 현재 아티팩트와 일치하지 않는 경우 확
     인에 사용할 아티팩트를 나타내는 문자열입니다. 이 값에 대한 옵션은
     [alternativeArtficacts.ts](../scripts/hardhat/alternativeArtifacts.ts)에서
     찾을 수 있습니다.
   - `optimizerRuns`: 계약을 컴파일할 때 지정된 옵티마이저 실행 횟수를 나타내는
     정수입니다. 이 값은 [foundry.toml](../foundry.toml)의 값과 일치하지 않는 경
     우에만 포함해야 합니다.

2. [여기](./metadata_extraction.md)의 단계에 따라 다음 각 계약에 대한 메타데이터
   를 추출합니다.

   1. FiatTokenV2_2 메타데이터를 `verification_artifacts/FiatTokenV2_2.json`으로
      추출합니다.
   2. FiatTokenProxy 메타데이터를 `verification_artifacts/FiatTokenProxy.json`으
      로 추출합니다.
   3. SignatureChecker 메타데이터를
      `verification_artifacts/SignatureChecker.json`으로 추출합니다.

   이 단계가 끝나면 로컬 디렉터리는 다음과 같아야 합니다.

   ```
   stablecoin-evm
   ├── verification_artifacts
   │   ├── FiatTokenV2_2.json
   │   ├── FiatTokenProxy.json
   │   ├── SignatureChecker.json
   │   └── input.json
   ├── ...
   ```

   이름은 확인 스크립트에 의해 엄격하게 적용됩니다.

## 확인 단계

1. "**[B2N]**" 접두사가 붙은 제목으로 Circle의 공개 저장소에 PR을 만듭니다.
2. Circle의 담당자에게 PR을 만들었다고 알리고 Circle의 GitHub 작업 실행 승인을기
   다립니다.
3. PR이 확인되고 워크플로가 승인되면 자동 바이트코드 확인이 실행됩니다. 거기에서
   PR 페이지의 확인 섹션을 확인하여 결과를 확인할 수 있습니다. 확인에 실패하면동
   일한 PR에 다른 커밋을 제출하여 다른 확인을 요청할 수 있습니다.
4. 확인이 성공하면 Circle의 담당자에게 알립니다.

## 일반적인 문제

### 컴파일러 설정

컴파일러 설정을 확인하고 옵티마이저 실행을 포함한 모든 것이 당사와 일치하는지 확
인하십시오.

### 메타데이터 불일치

메타데이터 파일의 서식을 지정하지 말고 추출된 그대로 두십시오. 파일 서식을 지정
하면 해시가 일치하지 않게 됩니다.
