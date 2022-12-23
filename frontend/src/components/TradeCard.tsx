import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Flex, Text, SimpleGrid, Image, Spinner, useDisclosure, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Box, Link, keyframes, useToast } from '@chakra-ui/react'
import axios from 'axios'
import { useState } from 'react'
import { HiOutlineSwitchHorizontal } from 'react-icons/hi'
import { getToken } from '../helpers/AuthRequest'
import { TradeData } from '../types/TradeData'

interface PinData {
    amount: number,
    brawler: string,
    pin: string,
    pinImage: string,
    rarityColor: string,
    rarityValue:  number
}

export default function TradeCard({ data }: {data: TradeData}) {
    const [tradeComplete, setCompletion] = useState<boolean>(false);
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [received, setReceived] = useState<[PinData]>();
    const toast = useToast()

    const confirmTrade = () => {

        axios.post('/trade/accept', {
            token: getToken(),
            tradeid:  data.tradeid,
            useWildCards: true,
            forceAccept: false
        })
        .then((res) => {
            setReceived(res.data)
            setCompletion(true)
            console.log(res.data)
        })
        .catch(function(err){
            toast({title: 'Error', description: 'Please ensure you have the right resources to accept the trade or try again later.', status: 'error', duration: 5000, isClosable: true})
        })
        
        
    }

    const refreshPage = () => {
        onClose();
        if (tradeComplete){
            window.location.reload();
        }
        
    }

    const contentTransition = keyframes`
        from {transform: scale(0.3);}
        to {transform: scale(1.0)}
    `

    return (
        <>
            <Flex h={'25vh'} maxW={'fit-content'} flexDir={'column'} alignItems={'center'} justifyContent={'space-between'} textAlign={'center'} bgColor={'blue.800'} p={3} borderRadius={'xl'} border={'2px solid black'} onClick={onOpen} cursor={'pointer'} _hover={{transform: "scale(110%)"}} transition={'0.25s'} boxShadow={'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px;'}>
                <Flex w={'85%'} justifyContent={'space-between'} color={'white'} fontSize={'lg'}>
                    <Text color={'red.500'}>Requesting</Text>
                    <Text color={'green.400'}>Offering</Text>
                </Flex>

                <Flex justifyContent={'center'} alignItems={'center'} maxH={'70%'} >

                    
                        <SimpleGrid w={'10vw'} columns={[1, 2]} spacing={3} overflow={'auto'} maxH={'100%'} sx={{
                    '&::-webkit-scrollbar': {
                    width: '8px',
                    borderRadius: '8px',
                    backgroundColor: `rgba(0, 0, 0, 0.05)`,
                    },
                    '&::-webkit-scrollbar-thumb': {
                    backgroundColor: `rgba(0, 0, 0, 0.5)`,
                    borderRadius: `6px`,
                    },
                }}>
                            {data.request.map((request) => (
                                <Flex p={3} border={'2px solid black'} borderRadius={'lg'} bgColor={request.rarityColor} flexDir={'column'} justifyContent={'center'} alignItems={'center'} pos={'relative'}>
                                    <Image  maxW={'60px'} src={`/image/${request.pinImage}`} fallback={<Spinner/>}/>
                                    <Text pos={'absolute'} className={'heading-lg'} top={0} right={1} fontSize={'lg'} color={'white'}>{request.amount}</Text>
                                </Flex>
                            ))}
                        </SimpleGrid>
                    

                    <Flex flexDir={'column'} justifyContent={'space-evenly'} alignItems={'center'} mx={'1vw'}  color={'white'} h={'100%'}>
                        <Flex alignItems={'center'}>
                            <Image w={'30px'} h={'30px'} src={'/image/resources/resource_trade_credits.webp'}/>
                            <Text ml={1} fontSize={'2xl'}>{data.cost}</Text>                                
                        </Flex>

                        <HiOutlineSwitchHorizontal fontSize={'30px'}/>
                    </Flex>

                    
                        <SimpleGrid w={'10vw'} columns={[1, 2]} spacing={3} overflow={'auto'} maxH={'100%'} sx={{
                    '&::-webkit-scrollbar': {
                    width: '8px',
                    borderRadius: '8px',
                    backgroundColor: `rgba(0, 0, 0, 0.05)`,
                    },
                    '&::-webkit-scrollbar-thumb': {
                    backgroundColor: `rgba(0, 0, 0, 0.5)`,
                    borderRadius: `6px`,
                    },
                }}>
                            {data.offer.map((offer) => (
                                <Flex p={3} border={'2px solid black'} borderRadius={'lg'} bgColor={offer.rarityColor} flexDir={'column'} justifyContent={'center'} alignItems={'center'} pos={'relative'}>
                                    <Image  maxW={'60px'} src={`/image/${offer.pinImage}`} fallback={<Spinner/>}/>
                                    <Text pos={'absolute'} className={'heading-lg'} top={0} right={1} fontSize={'lg'} color={'white'}>{offer.amount}</Text>
                                </Flex>
                            ))}
                        </SimpleGrid>

                </Flex>
                <Text fontSize={'lg'} color={'white'}>{data.creator}</Text>
            </Flex>
            <Modal isOpen={isOpen} onClose={refreshPage} size={'6xl'}>
                <ModalOverlay />
                <ModalContent>
                <ModalHeader fontWeight={'normal'} color={'white'} className={'heading-2xl'}>{tradeComplete ? "Success!" :  "Confirm Trade"}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {!tradeComplete ? 
                    <>
                    <Flex w={'100%'} flexDir={'row'}>
                        <Flex w={'50%'} alignItems={'center'} flexDir={'column'}>
                            <Text mb={5} fontSize={'2xl'} className={'heading-2xl'} color={'white'}>You Give</Text>
                            
                
                            <SimpleGrid columns={[2,3]} spacing={3} overflow={'auto'} sx={{
                                '&::-webkit-scrollbar': {
                                width: '8px',
                                borderRadius: '8px',
                                backgroundColor: `rgba(0, 0, 0, 0.05)`,
                                },
                                '&::-webkit-scrollbar-thumb': {
                                backgroundColor: `rgba(0, 0, 0, 0.5)`,
                                borderRadius: `6px`,
                                },
                            }}>
                            {data.request.map((request) => (
                                <Flex p={5} border={'2px solid black'} borderRadius={'lg'} bgColor={request.rarityColor} flexDir={'column'} justifyContent={'center'} alignItems={'center'} pos={'relative'}>
                                    <Image  maxW={'60px'} src={`/image/${request.pinImage}`} fallback={<Spinner/>}/>
                                    <Text pos={'absolute'} className={'heading-lg'} top={0} right={1} fontSize={'lg'} color={'red'}>{`- ${request.amount}`}</Text>
                                </Flex>
                            ))}
                        </SimpleGrid>
                  

                            
                 
                        </Flex>

                        <Flex w={'50%'} alignItems={'center'} flexDir={'column'}>
                        <Text mb={5} fontSize={'2xl'} className={'heading-2xl'} color={'white'}>You Receive</Text>
                            
                
                            <SimpleGrid columns={[2,3]} spacing={3} overflow={'auto'} sx={{
                                '&::-webkit-scrollbar': {
                                width: '8px',
                                borderRadius: '8px',
                                backgroundColor: `rgba(0, 0, 0, 0.05)`,
                                },
                                '&::-webkit-scrollbar-thumb': {
                                backgroundColor: `rgba(0, 0, 0, 0.5)`,
                                borderRadius: `6px`,
                                },
                            }}>
                            {data.offer.map((offer) => (
                                <Flex p={5} border={'2px solid black'} borderRadius={'lg'} bgColor={offer.rarityColor} flexDir={'column'} justifyContent={'center'} alignItems={'center'} pos={'relative'}>
                                    <Image  maxW={'60px'} src={`/image/${offer.pinImage}`} fallback={<Spinner/>}/>
                                    <Text pos={'absolute'} className={'heading-lg'} top={0} right={1} fontSize={'lg'} color={'green'}>{`+ ${offer.amount}`}</Text>
                                </Flex>
                            ))}
                        </SimpleGrid>
                        </Flex>

                    </Flex>
                    <Flex w={'100%'} flexDir={'row'} mt={5}>
                        <Box w={'50%'} h={'3px'} bgColor={'red'}></Box>
                        <Box w={'50%'} h={'3px'} bgColor={'green'}></Box>
                    </Flex>
                    <Flex w={'100%'} justifyContent={'center'} mt={5}>
                        <Button colorScheme={'whatsapp'} onClick={confirmTrade} rightIcon={<Image maxH={'40px'} src={'/image/resources/resource_trade_credits.webp'}/>} p={8}>
                            <Flex alignItems={'center'} justifyContent={'center'}>
                                <Text fontSize={'3xl'} className={'heading-2xl'} color={'white'} mr={2}>{data.cost}</Text>
                            </Flex>        
                        </Button>
                    </Flex>
                    </>
                    : <>
                        <Flex flexDir={'column'}>
                        <Box borderTop={'2px solid #9f9'} bgColor={'#f3fff3'} p={3}>
                            <Flex whiteSpace={'pre-wrap'}>
                                <Text fontSize={'xl'} className={'heading-2xl'} color={'white'}>Your Trade with </Text><Text fontSize={'xl'} className={'heading-2xl'} color={'white'} fontWeight={'bold'}>{data.creator}</Text><Text fontSize={'xl'} className={'heading-2xl'} color={'white'}> Has Been Completed!</Text>
                            </Flex>
                            <br></br>
                        </Box>
                        <Flex w={'100%'} justifyContent={'center'} mt={5}>
                            <Text fontSize={'xl'} className={'heading-2xl'} color={'white'}>You Received</Text>
                        </Flex>
                        <SimpleGrid columns={(received && received.length > 4) ? Math.ceil(received.length / 2) : ((received?.length === 1) ? 2 : received?.length)} spacing={10} mt={5}>
                            {received?.map((data, x) => (
                                <Flex p={5} border={'2px solid black'} borderRadius={'lg'} bgColor={data.rarityColor} flexDir={'column'} justifyContent={'center'} alignItems={'center'} pos={'relative'} transform={'scale(0)'} animation={`${contentTransition} 0.5s ease-out ${((x/2)+0.5)}s 1 forwards`}>
                                    <Image src={`/image/${data.pinImage}`} fallback={<Spinner/>}/>
                                    <Text fontSize={'3xl'} color={'white'} className={'heading-3xl'}>{`+${data.amount}`}</Text>
                                </Flex>
                            ))}
                        </SimpleGrid>
                        </Flex>
                    </>
                }
                </ModalBody>

                <ModalFooter>
                    {!tradeComplete ? <Text>{`Created By: ${data.creator}`}</Text> : 
                    
                    <Flex bgColor={'#f99ff9'} p={2} borderRadius={'lg'}>
                        <Link fontSize={'lg'} href={`/collection`} color={'white'} className={'heading-md'}>View Collection <ExternalLinkIcon mx={'2px'}/></Link>
                    </Flex>      
                    }
                </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}