import {  useEffect, useState } from "react"

import { Await, useLocation, useNavigate } from "react-router-dom";
import useAxiosPrivate from "./useAxiosPrivate";


export default function Users  ()  {

    const [user, setUser] = useState();
const axiosPrivate = useAxiosPrivate();
const navigate = useNavigate();
const location = useLocation();




    useEffect(()=>{
    let isMounted = true;
    const controller = new AbortController();

    const getUsers = async () => {
        try {
            const response = await axiosPrivate.get('/users',{
                signal: controller.signal
            });
            console.log(response.data);
            isMounted && setUser(response.data);
        } catch (err) {
            console.log(err);
            navigate('/login', {state: {from: location}, replace:true});
            
        }
    }
    getUsers();
    return () =>{
        isMounted = false;
        controller.abort();
    }

})

return(<>
    <article>
        <h2>User Lists</h2>
        {user?.length ? (<ul>
{user.map((user, i)=> <li key={i}>{user?.username}</li>)}

        </ul>) : <p>No User to show</p>}
        
    </article>
    </>)}