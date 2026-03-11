import collections

class SocialNetwork:
    

    def __init__(self):
        self.network = collections.defaultdict(set)

    def add_user(self, user_name: str) -> bool:
        if user_name in self.network:
            return False 
        self.network[user_name] = set()
        print(f"User '{user_name}' added.")
        return True

    def create_friendship(self, user_a: str, user_b: str) -> bool:
        if user_a == user_b:
            print("Error: Users must be different for a friendship.")
            return False

        self.network[user_a].add(user_b)
        self.network[user_b].add(user_a)

        print(f"Friendship created between {user_a} and {user_b}.")
        return True

    def get_friends(self, user_name: str) -> list[str]:
        if user_name not in self.network:
            return []
        return sorted(list(self.network[user_name]))

    def _get_non_friends(self, current_user: str) -> list[str]:
        if current_user not in self.network:
            return []

        all_users = set(self.network.keys())
        friends = self.network[current_user]

        non_friends = (all_users - friends) - {current_user}
        return sorted(list(non_friends))

    def calculate_mutual_friends(self, user_a: str, user_b: str) -> int:
        if user_a not in self.network or user_b not in self.network:
            return 0
        friends_a = self.network[user_a]
        friends_b = self.network[user_b]

        return len(friends_a.intersection(friends_b))

    def get_recommendations(self, current_user: str) -> list[tuple[str, int]]:
        non_friends = self._get_non_friends(current_user)
        recommendations = []

        for potential_friend in non_friends:
            mutual_count = self.calculate_mutual_friends(current_user, potential_friend)
            if mutual_count > 0:
                recommendations.append((potential_friend, mutual_count))

        recommendations.sort(key=lambda x: x[1], reverse=True)
        return recommendations


if __name__ == '__main__':
    net = SocialNetwork()
    net.add_user("Alice")
    net.add_user("Bob")
    net.add_user("Charlie")
    net.add_user("David")
    net.add_user("Eve")
    net.add_user("Frank")

    net.create_friendship("Alice", "Bob")
    net.create_friendship("Alice", "Charlie")
    net.create_friendship("Bob", "Charlie")
    net.create_friendship("Bob", "David")
    net.create_friendship("Charlie", "Eve")
    net.create_friendship("David", "Eve")
    net.create_friendship("Frank", "Eve")

    print("\n--- Network Status ---")
    for user in sorted(net.network.keys()):
        print(f"{user}'s friends: {', '.join(net.get_friends(user))}")

    print("\n--- Recommendation for Alice ---")
    alice_recs = net.get_recommendations("Alice")
    print(f"Alice's Friends: {net.get_friends('Alice')}")
    print("Non-friends (potential recommendations):")
    if alice_recs:
        for user, count in alice_recs:
            print(f"- {user} (Mutual friends: {count})")
    else:
        print("No recommendations based on mutual friends.")
        
    print("\n--- Recommendation for Frank ---")
    frank_recs = net.get_recommendations("Frank")
    print(f"Frank's Friends: {net.get_friends('Frank')}")
    print("Non-friends (potential recommendations):")
    if frank_recs:
        for user, count in frank_recs:
            print(f"- {user} (Mutual friends: {count})")
    else:
        print("No recommendations based on mutual friends.")

    mutual_count = net.calculate_mutual_friends("David", "Charlie")
    print(f"\nMutual friends between David and Charlie: {mutual_count}")
