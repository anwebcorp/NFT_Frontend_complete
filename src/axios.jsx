/* eslint-disable react-refresh/only-export-components    */ 
import axios from "axios";
const BASE_URL = 'https://employeemanagement.company/api/';
//https://employeemanagement.company
// Only export the default axios instance for public requests
export default axios.create({
    baseURL: BASE_URL
});