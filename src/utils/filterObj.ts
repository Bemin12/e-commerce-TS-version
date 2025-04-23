export default (obj: any, ...allowedFields: string[]) => {
  const filteredObj: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) filteredObj[key] = obj[key];
  });

  return filteredObj;
};
