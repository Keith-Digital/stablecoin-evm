import Firefly from "@hyperledger/firefly-sdk";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("host", {
      alias: "h",
      type: "string",
      description: "Firefly host",
      default: "http://127.0.0.1:5000",
    })
    .option("namespace", {
      alias: "n",
      type: "string",
      description: "Firefly namespace",
      default: "default",
    })
    .option("interface", {
      alias: "i",
      type: "string",
      description: "Contract interface name",
      required: true,
    })
    .option("address", {
      alias: "a",
      type: "string",
      description: "Contract address",
      required: true,
    })
    .option("name", {
      type: "string",
      description: "API name for the contract instance",
    })
    .help().argv;

  const HOST = argv.host;
  const NAMESPACE = argv.namespace;
  const INTERFACE_NAME = argv.interface;
  const CONTRACT_ADDRESS = argv.address;
  const API_NAME = argv.name || `${INTERFACE_NAME}-${new Date().getTime()}`;

  const ff = new Firefly({ host: HOST, namespace: NAMESPACE });

  try {
    // 1. First, check if the interface exists
    console.log(`Looking for interface: ${INTERFACE_NAME}`);
    const interfaces = await ff.getContractInterfaces();
    const interfaceInfo = interfaces.find(
      (iface: any) => iface.name === INTERFACE_NAME
    );

    if (!interfaceInfo) {
      console.error(
        `Interface '${INTERFACE_NAME}' not found. Please register the interface first.`
      );
      process.exit(1);
    }

    console.log(`Found interface: ${interfaceInfo.id}`);

    // 2. Create ContractAPI (register contract instance)
    console.log(
      `\nRegistering Contract API '${API_NAME}' at ${CONTRACT_ADDRESS}...`
    );

    const contractAPI = await ff.createContractAPI({
      interface: {
        id: interfaceInfo.id,
      },
      name: API_NAME,
      location: {
        address: CONTRACT_ADDRESS,
      },
    });

    console.log("\n✅ Successfully registered Contract API:");
    console.log(JSON.stringify(contractAPI, null, 2));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message &&
      error.message.includes("FF10298")
    ) {
      console.log(`Contract API '${API_NAME}' already exists.`);
      try {
        const apis = await ff.getContractAPIs();
        const existing = apis.find((api: any) => api.name === API_NAME);
        if (existing) {
          console.log("\nExisting Contract API:");
          console.log(JSON.stringify(existing, null, 2));
        }
      } catch (listError) {
        if (listError instanceof Error) {
          console.error("Error retrieving existing APIs:", listError.message);
        } else {
          console.error("❌ Error retrieving existing APIs:", listError);
        }
      }
    } else {
      if (error instanceof Error) {
        console.error("Error registering Contract API:", error.message);
      } else {
        console.error("❌ Error registering Contract API:", error);
      }
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
