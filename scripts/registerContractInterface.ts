import Firefly from "@hyperledger/firefly-sdk";
import fs from "fs";

const HOST = "http://127.0.0.1:5000";
const NAMESPACE = "default";

interface ContractInfo {
  name: string;
  version: string;
  abiPath: string;
}

async function main() {
  // 명령줄 인수 파싱
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log(
      "사용법: ts-node ./scripts/firefly/registerContractInterface.ts <컨트렉트명> <버전> <ABI파일경로>"
    );
    console.log(
      "예시: ts-node ./scripts/firefly/registerContractInterface.ts FiatTokenV2 2.0 ./artifacts/contracts/security/RegularSecurity.sol/RegularSecurity.json"
    );
    process.exit(1);
  }

  const [contractName, version, abiPath] = args;

  const contractInfo: ContractInfo = {
    name: contractName,
    version: version,
    abiPath: abiPath.startsWith("@") ? abiPath.substring(1) : abiPath,
  };

  const ff = new Firefly({ host: HOST, namespace: NAMESPACE });

  try {
    // ABI 파일 읽기
    if (!fs.existsSync(contractInfo.abiPath)) {
      console.error(`ABI 파일을 찾을 수 없습니다: ${contractInfo.abiPath}`);
      process.exit(1);
    }

    const abiContent = fs.readFileSync(contractInfo.abiPath, "utf8");
    const { abi } = JSON.parse(abiContent);

    const ffi = await ff.generateContractInterface({
      name: contractInfo.name,
      version: contractInfo.version,
      input: {
        abi: abi,
      },
    });

    const contractInterface = await ff.createContractInterface(ffi);
    console.log("✅ Successfully created contract interface:");
    console.log(JSON.stringify(contractInterface, null, 2));
  } catch (error) {
    if (
      error.message.includes("FF10165") ||
      error.message.includes("FF10407")
    ) {
      console.log(
        `ℹ️  Contract interface '${contractInfo.name}' already exists or conflicts.`
      );

      try {
        const interfaces = await ff.getContractInterfaces();
        const existing = interfaces.find(
          (iface: any) => iface.name === contractInfo.name
        );
        if (existing) {
          console.log("Existing contract interface details:");
          console.log(JSON.stringify(existing, null, 2));
        } else {
          console.log(
            `'${contractInfo.name}' interface not found in list, but a conflict was reported.`
          );
        }
      } catch (listError) {
        console.error("❌ Error retrieving existing interface:", listError);
      }
    } else {
      console.error("❌ Error creating contract interface:", error);
      process.exit(1);
    }
  }
}

main();
