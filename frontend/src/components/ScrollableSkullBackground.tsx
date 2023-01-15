import { Flex, Image, keyframes } from "@chakra-ui/react";

export default function SkullBackground() {

    const animation1 = keyframes`
        0% {
            transform: translateY(0px);
        }

        100% {
            transform: translateY(2762px);
        }
    
    `

    const animation2 = keyframes`
        0% {
            transform: translateY(-2762px);
        }

        100% {
            transform: translateY(0px);
        }
    
    `

    const iconName = localStorage.getItem('icon') || 'themes/free/default_icon.webp'
    const backgroundName = localStorage.getItem('background') || 'themes/free/default_background.webp'

    return (
        <Flex pos={'absolute'} overflow={'hidden'} zIndex={'-1'} top={0} w={'100%'} h={'100%'}>                        
            <Image w={'100vw'} h={'2762px'} objectFit={'cover'} animation={`${animation1} 175s linear infinite reverse`} pos={'absolute'} src={`/image/${iconName}`}/>
            <Image w={'100vw'} h={'2762px'} objectFit={'cover'} animation={`${animation2} 175s linear infinite reverse`} pos={'absolute'} src={`/image/${iconName}`}/>
            <Flex w={'100%'} h={'100%'} backgroundRepeat={'no-repeat'} objectFit={'cover'} backgroundAttachment={'fixed'} backgroundImage={`/image/${backgroundName}`}/>    
        </Flex>
        
    )
}