import {Flex, Text, Image, VStack} from "@chakra-ui/react";
import SkullBackground from "../components/SkullBackground";
import {useState, useEffect} from "react";
import axios, {AxiosResponse} from "axios";
import {getToken} from "../helpers/AuthRequest";
import {displayShort, displayLong} from "../helpers/LargeNumberDisplay";
import {UserInfoProps} from "../types/AccountData";
import api from "../helpers/APIRoute";

type LeaderboardData = {
    username: string;
    avatar: string;
    level: number;
    points: number;
    upgradePoints: number;
}[];

export default function Leaderboard(){
    const [data, setData] = useState<LeaderboardData>([]);
    const [username, setUsername] = useState<string>("");

    const getRank = (data: LeaderboardData, username: string): string => {
        const rank = data.findIndex((value) => value.username === username);
        if (rank >= 0){
            return `You are ranked #${rank + 1}.`;
        }
        return "You are not ranked.";
    }

    useEffect(() => {
        axios.get<{}, AxiosResponse<LeaderboardData>>(`${api}/challenge/leaderboard`)
        .then((res) => {
            setData(res.data);
        }).catch((error) => {
            setData([]);
        });

        // The user does not need to be logged in to see the leaderboard but if
        // they are logged in, it will display their current rank
        // Not being logged in here is not an error
        const token = getToken();
        if (token !== void 0){
            axios.post<{}, AxiosResponse<UserInfoProps>>(`${api}/resources`, {token: token})
            .then((res) => {
                setUsername(res.data.username);
            }).catch((error) => {});
        }

        return (() => {
            setData([]);   
        })
    }, []);

    return (
        <Flex flexDir={"column"} alignItems={"center"}>
            <SkullBackground/>
            <Text fontSize={"4xl"} className={"heading-4xl"} mb={5}>Challenge Leaderboard</Text>
            {(data !== void 0) ? <Text fontSize={"xl"} className={"heading-xl"} mb={2}>{getRank(data, username)}</Text> : <></>}
            <Flex w={"90vw"} maxW={"1280px"} bgColor={"gray.800"} mb={2} px={3} borderRadius={"md"} wrap={"wrap"}>
                <Flex w={["100%", "100%", "60%", "60%", "60%"]} alignItems={"center"}>
                    <Text w={"15%"} fontSize={["xs", "lg", "xl", "xl", "xl"]} className={"heading-xl"}>Rank</Text>
                    <Text w={"85%"} fontSize={"xl"} className={"heading-xl"}>Username</Text>
                </Flex>
                <Flex w={["100%", "100%", "40%", "40%", "40%"]} alignItems={"center"}>
                    <Text w={["25%", "15%", "25%", "25%", "25%"]} fontSize={"xl"} className={"heading-xl"}>Level</Text>
                    <Text w={"75%"} fontSize={"xl"} className={"heading-xl"}>Challenge Points</Text>
                </Flex>
            </Flex>
            <VStack w={"90vw"} maxW={"1280px"} mb={10}>
                {data.map((value, index) => {
                    let color = "blue.500";
                    if (index === 0){
                        color = "#ffd700";
                    } else if (index === 1){
                        color = "#c9c6f1";
                    } else if (index === 2){
                        color = "#ff9900";
                    } else if (value.username === username){
                        color = "blue.300";
                    }
                    return (
                        <Flex key={index} w={"100%"} bgColor={color} px={3} py={0.5} borderRadius={"md"} wrap={"wrap"} overflow={"hidden"} border={value.username === username ? "2px solid #0f0" : "2px solid #000"}>
                            <Flex w={["100%", "100%", "60%"]}>
                                <Flex w={"15%"} alignItems={"center"}>
                                    <Text fontSize={"xl"} className={"heading-xl"} color={value.username === username ? "#0f0" : "#fff"}>{index + 1}</Text>
                                </Flex>
                                <Flex w={"85%"} alignItems={"center"}>
                                    <Image src={`${api}/image/${value.avatar}`} border={"2px solid #fff"} borderRadius={"50%"} h={10} mr={1}/>
                                    <Text fontSize={value.username.length > 20 ? ["xs", `${(15 - (value.username.length - 20) * 0.25) / 16}rem`, `${(15 - (value.username.length - 20) * 0.25) / 16}rem`, `${(20 - (value.username.length - 20) * 0.5) / 16}rem`, "xl"] : ["md", "md", "lg", "xl"]} className={"heading-xl"}>{value.username}</Text>
                                </Flex>
                            </Flex>
                            <Flex w={["100%", "100%", "40%"]}>
                                <Flex w={["15%", "15%", "25%"]} alignItems={"center"}>
                                    <Text fontSize={["lg", "lg", "xl"]} className={"heading-xl"}>{value.level}</Text>
                                </Flex>
                                <Flex w={["85%", "85%", "75%"]} alignItems={"center"}>
                                    <Text fontSize={["md", "lg", "xl"]} className={"heading-xl"}>{value.upgradePoints > 0 ? `${displayLong(value.points)} / ${displayShort(value.upgradePoints)}` : `${displayLong(value.points)}`}</Text>
                                </Flex>
                            </Flex>
                        </Flex>
                    );
                })}
            </VStack>
        </Flex>
    );
}
