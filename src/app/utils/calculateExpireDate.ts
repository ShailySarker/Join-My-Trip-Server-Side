export const calculateExpireDate = (plan: string): Date => {
  const now = new Date();
  const expireDate = new Date(now);

  if (plan.toLowerCase().includes("monthly")) {
    expireDate.setDate(now.getDate() + 30);
  } else if (plan.toLowerCase().includes("yearly")) {
    expireDate.setDate(now.getDate() + 365);
  } else {
    expireDate.setDate(now.getDate() + 30); // default
  }

  return expireDate;
};
