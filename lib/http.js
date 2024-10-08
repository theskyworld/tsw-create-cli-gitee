import axios from "axios";
import { TEMPLATE_URL } from "../bin/utils/constants.js";

axios.interceptors.response.use((resp) => {
  return resp.data;
});

// 获取github项目模板
async function getTemplateList() {
  const resp = await axios.get(TEMPLATE_URL);
  return resp;
}

export { getTemplateList };
