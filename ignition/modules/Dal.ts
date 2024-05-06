import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CAP = 1000;

const DalModule = buildModule("DalModule", (m) => {
  const cap = m.getParameter("cap", CAP);
  const dal = m.contract("Dal", [cap]);

  return { dal };
});

export default DalModule;
