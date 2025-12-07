import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedFHEPrivateQA = await deploy("FHEPrivateQA", {
    from: deployer,
    log: true,
  });

  console.log(`FHEPrivateQA contract: `, deployedFHEPrivateQA.address);
};
export default func;
func.id = "deploy_FHEPrivateQA"; // id required to prevent reexecution
func.tags = ["FHEPrivateQA"];
