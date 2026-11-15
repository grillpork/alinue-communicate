export class ApiError extends Error {
  constructor(status, message, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getApiErrorMessage(error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return "กรุณาเข้าสู่ระบบ";
      case 403:
        return "คุณไม่มีสิทธิ์ดำเนินการ";
      case 404:
        return "ไม่พบข้อมูล";
      case 409:
        return "ข้อมูลมีการเปลี่ยนแปลง";
      case 429:
        return "กรุณารอสักครู่";
      default:
        return error.message || "เกิดข้อผิดพลาดจากระบบ";
    }
  }

  return error?.message || "ไม่สามารถเชื่อมต่อระบบได้";
}
