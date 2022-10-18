import Api from "./api";
import request from "../common/request";

class UserApi extends Api {
    constructor() {
        super("users");
    }

    GetAll = async () => {
        let result = await request.get(`/${this.group}`);
        if (result['code'] !== 1) {
            return [];
        }
        return result['data'];
    }

    resetTotp = async (id) => {
        let result = await request.post(`/${this.group}/${id}/reset-totp`);
        return result['code'] === 1;
    }

    changePassword = async (id, password) => {
        let formData = new FormData();
        formData.set('password', password);
        let result = await request.post(`/${this.group}/${id}/change-password`, formData);
        return result['code'] === 1;
    }

    changeStatus = async (id, status) => {
        let result = await request.patch(`/${this.group}/${id}/status?status=${status}`);
        return result['code'] !== 1;
    }
}

const userApi = new UserApi();
export default userApi;