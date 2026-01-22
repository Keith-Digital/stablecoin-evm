# 메타데이터 추출

중요 참고 사항: FiatTokenProxy, FiatToken2_2(작성 당시) 및 SignatureChecker 계약
에 대한 메타데이터를 별도로 자체 JSON 파일로 추출하십시오.

사용하는 개발 프레임워크에 따라 아티팩트 메타데이터를 찾는 방법이 다릅니다. 단계
및 일반 정보는 아래에 설명되어 있습니다.

## 파운드리

파운드리는 각 `.sol` 파일에 대한 빌드 정보를 디렉터리에 자동으로 저장하며, 일반
적으로 `foundry.toml` 파일에 달리 지정되지 않는 한 `out` 디렉터리입니다. 계약
`example.sol`의 경우 메타데이터는 사용하는 파운드리 버전에 따라
`out/example.sol/example.json`의 `rawMetadata` 필드 아래에 저장됩니다. 메타데이
터를 검색하려면 다음 명령을 실행하면 됩니다.

```sh
cat path/to/example.sol/example.json | jq -jr '.rawMetadata' > example.metadata.json
```

## 하드햇

하드햇은 컴파일된 출력을 `artifacts` 디렉터리(또는 `hardhat.config.ts`에 지정된
아티팩트 경로)에 저장하며, 여기에는 메타데이터를 추출하는 데 필요한 두 개의 하위
디렉터리인 `build-info`와 `contracts`가 포함됩니다. `build-info` 디렉터리에는 16
진수 ID가 있는 파일이 포함되어 있습니다. 루트 디렉터리에서 다음 명령을 실행하여
`example.sol`의 메타데이터를 `example.metadata.json`으로 출력할 수 있습니다.

```sh
cat "$(jq -r '.buildInfo' path/to/artifacts/contracts/path/to/example.sol/example.dbg.json | sed 's|^\.\./\.\./\.\./|path/to/artifacts/|')" | jq -jr '.output.contracts["contracts/path/to/example.sol"].example.metadata' > example.json
```
