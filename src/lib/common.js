export const formatDate = (dateString) => {
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export const calculateTimeDifference = (startTime,endTime) => {
  const startDate = new Date(`1970-01-01T${startTime}`);
  const endDate = new Date(`1970-01-01T${endTime}`);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error("Invalid start or end time format");
  }
  const differenceInMilliseconds = endDate - startDate;
  const totalMinutes = Math.floor(differenceInMilliseconds / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const decimalTime = hours + minutes / 60;
  return decimalTime;
};

export const formatRole = (role) => {
  return role.includes(' ')
    ? role.toLowerCase().replace(/\s+/g, '_')
    : role.toLowerCase();
};
