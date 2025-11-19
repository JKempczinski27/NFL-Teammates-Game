//
//  PlayerImageView.swift
//  NFLTeammatesGameiOS
//
//  Created by NFL Teammates Game
//

import SwiftUI

struct PlayerImageView: View {
    let player: Player
    @State private var image: UIImage?
    @State private var isLoading = false

    var body: some View {
        VStack {
            ZStack {
                if let image = image {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 100, height: 100)
                        .clipShape(Circle())
                        .overlay(Circle().stroke(Color.white, lineWidth: 2))
                } else {
                    Circle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(width: 100, height: 100)
                        .overlay(
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        )
                }
            }

            Text(player.name)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .frame(width: 100)
        }
        .task {
            await loadImage()
        }
    }

    private func loadImage() async {
        guard image == nil, !isLoading else { return }

        isLoading = true
        defer { isLoading = false }

        guard let url = URL(string: player.imageUrl) else { return }

        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            if let loadedImage = UIImage(data: data) {
                self.image = loadedImage
            }
        } catch {
            print("Failed to load image for \(player.name): \(error)")
        }
    }
}

#Preview {
    PlayerImageView(player: Player(
        id: 1,
        name: "Tom Brady",
        position: "QB",
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/2330.png",
        teamsPlayed: ["NE", "TB"],
        yearsActive: "2000-2022"
    ))
    .background(Color(red: 0.87, green: 0.72, blue: 0.53))
}
