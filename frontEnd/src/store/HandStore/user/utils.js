import { userHand } from "../handStore.js"

export const setUserHand = (hand) => {
    userHand.update(oldHand => [...hand]);
    console.log($userHand);
}

