import { CloseButton, Flex, Image, Text, useToast } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { UserInfoProps } from '../types/AccountData'
import AuthRequest from '../helpers/AuthRequest'
import { RainbowBorder } from '../themes/animations'
import api from "../helpers/APIRoute";


interface Props{
    username: string;
    token: string;
    toggleRemove: boolean;
}

export default function AccountMenuDisplay({ username, token, toggleRemove }: Props) {
    const [data, setData] = useState<UserInfoProps>()

    const toast = useToast()

    useEffect(() => {
        AuthRequest<UserInfoProps>("/resources", {setState: setData, data: {token: token}});
    }, [token])


    const switchUser = () => {
        if (username !== localStorage.getItem('username')){
            localStorage.setItem('username', username)
            window.location.reload()
        } else {
            toast({description: 'Already on this account!', status: 'error', duration: 3000, isClosable: true})
        }
    }

    const removeUser = () => {
        let temp = JSON.parse(localStorage.getItem('tokens') || "{}")

        delete temp[username]

        localStorage.setItem('tokens', JSON.stringify(temp))

        if (username === localStorage.getItem('username')){
            localStorage.setItem('username', "")
        }

        window.location.reload()
        
    }

    return (
        <>
        {data &&
            <Flex pos={'relative'} flexDir={'column'} justifyContent={'center'} alignItems={'center'} my={5} cursor={'pointer'} background={(data.avatarColor === 'rainbow') ? 'black' : data?.avatarColor} animation={(data.avatarColor === 'rainbow') ? `${RainbowBorder()} 12s infinite` : ''} border={'3px solid'} borderColor={(localStorage.getItem('username') === username) ? 'blue.500' : 'black'} py={3} onClick={() => {if (!toggleRemove){switchUser()}}}>
                {toggleRemove && <CloseButton pos={'absolute'} top={1} right={1}  onClick={removeUser} fontSize={'lg'}/>}
                <Image src={`${api}/image/${data?.avatar}`} borderRadius={'50%'} mb={1}/>
                <Text color={(data.avatarColor === 'rainbow') ? 'gold' : 'white'} fontSize={'xl'} className={'heading-xl'}>{data?.username}</Text>
                <Flex maxH={'30px'} alignItems={'center'}>
                    <Text fontSize={'md'} className={'heading-md'}  mr={1}>{data?.tokens}</Text>
                    <Image maxW={'25px'} src={`${api}/image/resources/resource_tokens.webp`}/>
                </Flex>            
            </Flex>
        }
        </>
    )
}