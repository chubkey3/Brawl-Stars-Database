import { Box, Button, Flex, Image, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, ScaleFade, Text, useDisclosure } from '@chakra-ui/react'
import AuthRequest from '../helpers/AuthRequest'
import ShopData from '../types/ShopData'
import { useEffect, useState } from 'react'
import { HMStoS, StoHMS } from '../helpers/Countdown'
import { GrPowerReset } from 'react-icons/gr'



export default function ShopItem({data, isFeatured}: {data: ShopData, isFeatured?: Boolean}) {

    const { isOpen, onOpen, onClose } = useDisclosure()

    const [accepted, setAccepted] = useState<boolean>()  
    
    const [seconds, updateSeconds] =  useState<number>(HMStoS({hours: 23 - new Date().getHours() + Math.floor((new Date(new Date().getFullYear(), 0, 1).getTimezoneOffset() - new Date().getTimezoneOffset())/60),  minutes: 59 - new Date().getMinutes(), seconds: 59 - new Date().getSeconds()}))

    const purchase = (itemName: string) => {
        AuthRequest('/shop', {data: {item: itemName}, callback: () => {setAccepted(true)}, errorToastMessage: "Invalid Purchase"})
    }

    useEffect(() => {        
        const timer = setInterval(() => {
            if (seconds > 0 ){
                updateSeconds(prevState => prevState - 1)
            }            

            if (seconds == 0){
                window.location.reload()
            }
        }, 1000)

        return () => {
            clearInterval(timer)
        }                    
    }, [seconds])

    if (!isFeatured){

        return (
            <Flex alignItems={'center'} flexDir={'column'} borderRadius={'lg'} onClick={onOpen} w={'10vw'} p={5} cursor={'pointer'} pos={'relative'} bgColor={'lightskyblue'} border={'3px solid'} borderColor={'blue.500'} _hover={{
            ".top": {
                transitionDelay: "0s",
                transform: "scaleX(1)"
              },
              ".right": {
                transitionDelay: "0.05s",
                transform: "scaleY(1)"
              },
              ".bottom": {
                transitionDelay: "0.1s",
                transform: "scaleX(1)"
              },
              ".left": {
                transitionDelay: "0.15s",
                transform: "scaleY(1)"
              }
            }}>            
                <Box className='top' pos={'absolute'} display={'block'} background={'blue.500'} transition={`all 0.1s linear`} w={'100%'} height={'3px'} transform={'scaleX(0)'} top={0} left={0} transitionDelay={'0.15s'} transformOrigin={'top left'}></Box>
                <Box className='bottom' pos={'absolute'} display={'block'} background={'blue.500'} transition={`all 0.1s linear`} w={'100%'} height={'3px'} transform={'scaleX(0)'} bottom={0} right={0} transitionDelay={'0.05s'} transformOrigin={'top right'}></Box>
                <Box className='left' pos={'absolute'} display={'block'} background={'blue.500'} transition={`all 0.1s linear`} w={'3px'} height={'100%'} transform={'scaleY(0)'} top={0} left={0} transformOrigin={'bottom left'}></Box>
                <Box className='right' pos={'absolute'} display={'block'} background={'blue.500'} transition={`all 0.1s linear`} w={'3px'} height={'100%'} transform={'scaleY(0)'} top={0} right={0} transitionDelay={'0.1s'} transformOrigin={'top left'}></Box>
    
                <Flex p={5}>
                    <Image borderRadius={'lg'} src={`/image/${data.image}`}/>
                </Flex>
                <Flex>
                    {/*<Tag colorScheme={'red'} size={'sm'} mr={1}>NEW</Tag>*/}
                    <Text fontSize={'xl'} color={'white'} className={'heading-2xl'}>{data.displayName}</Text>
                </Flex>
                <Flex alignItems={'center'} mt={3}>
                    <Text fontSize={'lg'} color={'white'} className={'heading-xl'}>{data.cost}</Text>
                    <Image ml={1} maxH={'30px'} src={`/image/resources/resource_coins.webp`}/>
                </Flex>
    
                <Modal isOpen={isOpen} onClose={onClose} >
                    <ModalOverlay />
                        <ModalContent bgColor={(accepted) ? '#9f9' : 'lightskyblue'} border={'2px solid '}>
                        <ModalHeader color={'white'} className={'heading-2xl'} fontWeight={'normal'}>{accepted ? 'Purchase Successful!' : `Purchase ${data.displayName}`}</ModalHeader>
                        <ModalBody>
                            <Flex justifyContent={'center'}>
                                <Image boxShadow={(accepted) ? '0px 0px 50px #fff' : ''} borderRadius={'50%'} src={`/image/${data.image}`}/>
                            </Flex>
                        </ModalBody>
    
                        <ModalFooter>
                            <Button colorScheme='red' mr={3} onClick={(accepted) ? () => {window.location.reload()} : onClose}>
                            Close
                            </Button>
                            {accepted ? 
                            <></>
                            :
                            <Button colorScheme={'whatsapp'} onClick={() => {purchase(data.name)}}>{data.cost}<Image ml={1} maxH={'25px'} src={`/image/resources/resource_coins.webp`}/></Button>
                        }                        
                        </ModalFooter>
                        </ModalContent>
                </Modal>
            </Flex>       
        )
    } else {
        
        return (
            <Flex alignItems={'center'} flexDir={'column'} borderRadius={'lg'} onClick={onOpen} w={'35vw'} p={5} cursor={'pointer'} pos={'relative'} background={'linear-gradient(62deg, #8EC5FC 0%, #E0C3FC 100%)'} bgColor={'#8EC5FC'} border={'3px solid'} borderColor={'blue.400'} _hover={{transform: 'scale(1.1)'}} transition={'transform 0.05s linear'}>                                        
                    <Flex p={5}>
                        <Image borderRadius={'lg'} src={`/image/${data.image}`}/>
                    </Flex>
                    <Flex>
                        {/*<Tag colorScheme={'red'} size={'sm'} mr={1}>NEW</Tag>*/}
                        <Text fontSize={'2xl'} color={'white'} className={'heading-2xl'}>{data.displayName}</Text>
                    </Flex>
                    <Flex alignItems={'center'} mt={3}>
                        <Text fontSize={'xl'} color={'white'} className={'heading-xl'}>{data.cost}</Text>
                        <Image ml={1} maxH={'30px'} src={`/image/resources/resource_coins.webp`}/>
                    </Flex>
                    <Flex w={'100%'} justifyContent={'right'} mt={5}>
                        <Flex px={5} py={3} borderRadius={'30px'} bgColor={'lightskyblue'} alignItems={'center'} border={'2px solid'} borderColor={'blue.500'}>
                            <GrPowerReset fontSize={'20px'}/>                            
                            <Text ml={2} color={'white'} className={'heading-md'}>{(StoHMS(seconds).hours !== 0) ? `Offer Ends in ${StoHMS(seconds).hours}h ${StoHMS(seconds).minutes}m` : `Offer Ends in ${StoHMS(seconds).minutes}m ${StoHMS(seconds).seconds}s`}</Text>
                        </Flex>
                    </Flex>
        
                    <Modal isOpen={isOpen} onClose={onClose} >
                        <ModalOverlay />
                            <ModalContent bgColor={(accepted) ? '#9f9' : 'lightskyblue'} border={'2px solid '}>
                            <ModalHeader color={'white'} className={'heading-2xl'} fontWeight={'normal'}>{accepted ? 'Purchase Successful!' : `Purchase ${data.displayName}`}</ModalHeader>
                            <ModalBody>
                                <Flex justifyContent={'center'}>
                                    <Flex boxShadow={(accepted) ? '0px 0px 50px #fff' : ''} borderRadius={'50%'}>
                                        <Image src={`/image/${data.image}`}/>
                                    </Flex>
                                </Flex>
                            </ModalBody>
        
                            <ModalFooter>
                                <Button colorScheme='red' mr={3} onClick={(accepted) ? () => {window.location.reload()} : onClose}>
                                Close
                                </Button>
                                {accepted ? 
                                <></>
                                :
                                <Button colorScheme={'whatsapp'} onClick={() => {purchase(data.name)}}>{data.cost}<Image ml={1} maxH={'25px'} src={`/image/resources/resource_coins.webp`}/></Button>
                            }                        
                            </ModalFooter>
                            </ModalContent>
                    </Modal>
                </Flex>       
        )
    }
    
}