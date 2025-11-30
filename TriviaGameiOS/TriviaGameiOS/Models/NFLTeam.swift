//
//  NFLTeam.swift
//  TriviaGameiOS
//
//  Created on 2025-11-30
//

import Foundation
import SwiftUI

struct NFLTeam: Identifiable, Hashable {
    let id = UUID()
    let name: String
    let logoURL: String
    let playmakers: [String]

    static let allTeams: [NFLTeam] = [
        NFLTeam(name: "Buffalo Bills", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/BUF", playmakers: ["James Cook", "Amari Cooper"]),
        NFLTeam(name: "Miami Dolphins", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/MIA", playmakers: ["De'Von Achane", "Tyreek Hill"]),
        NFLTeam(name: "New England Patriots", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/NE", playmakers: ["Rhamondre Stevenson", "Stefon Diggs"]),
        NFLTeam(name: "San Francisco 49ers", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/SF", playmakers: ["Christian McCaffrey", "George Kittle"]),
        NFLTeam(name: "Baltimore Ravens", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/BAL", playmakers: ["Derrick Henry", "Zay Flowers"]),
        NFLTeam(name: "New York Giants", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/NYG", playmakers: ["Devin Singletary", "Malik Nabers"]),
        NFLTeam(name: "New York Jets", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/NYJ", playmakers: ["Breece Hall", "Garrett Wilson"]),
        NFLTeam(name: "Green Bay Packers", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/GB", playmakers: ["Josh Jacobs", "Christian Watson"]),
        NFLTeam(name: "Atlanta Falcons", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/ATL", playmakers: ["Bijan Robinson", "Drake London"]),
        NFLTeam(name: "Los Angeles Rams", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/LAR", playmakers: ["Kyren Williams", "Puka Nacua"]),
        NFLTeam(name: "Los Angeles Chargers", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/LAC", playmakers: ["J.K. Dobbins", "Ladd McConkey"]),
        NFLTeam(name: "Jacksonville Jaguars", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/JAX", playmakers: ["Travis Etienne", "Brian Thomas"]),
        NFLTeam(name: "Detroit Lions", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/DET", playmakers: ["Jahmyr Gibbs", "Amon-Ra St.Brown"]),
        NFLTeam(name: "Kansas City Chiefs", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/KC", playmakers: ["Kareem Hunt", "Travis Kelce"]),
        NFLTeam(name: "Pittsburgh Steelers", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/PIT", playmakers: ["D.K. Metcalf", "George Pickens"]),
        NFLTeam(name: "Indianapolis Colts", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/IND", playmakers: ["Jonathan Taylor", "Alec Pierce"]),
        NFLTeam(name: "Arizona Cardinals", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/ARI", playmakers: ["James Conner", "Marvin Harrison Jr."]),
        NFLTeam(name: "Cincinnati Bengals", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/CIN", playmakers: ["Chase Brown", "Ja'Marr Chase"]),
        NFLTeam(name: "Las Vegas Raiders", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/LV", playmakers: ["Alexander Mattison", "Brock Bowers"]),
        NFLTeam(name: "Tampa Bay Buccaneers", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/TB", playmakers: ["Bucky Irving", "Mike Evans"]),
        NFLTeam(name: "Washington Commanders", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/WAS", playmakers: ["Brian Robinson Jr.", "Terry McLaurin"]),
        NFLTeam(name: "Chicago Bears", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/CHI", playmakers: ["D'Andre Swift", "DJ Moore"]),
        NFLTeam(name: "Carolina Panthers", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/CAR", playmakers: ["Chuba Hubbard", "Adam Thielen"]),
        NFLTeam(name: "Dallas Cowboys", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/DAL", playmakers: ["Javonte Williams", "CeeDee Lamb"]),
        NFLTeam(name: "Denver Broncos", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/DEN", playmakers: ["Audric Estime", "Courtland Sutton"]),
        NFLTeam(name: "Houston Texans", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/HOU", playmakers: ["Joe Mixon", "Nico Collins"]),
        NFLTeam(name: "Minnesota Vikings", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/MIN", playmakers: ["Aaron Jones", "Justin Jefferson"]),
        NFLTeam(name: "New Orleans Saints", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/NO", playmakers: ["Alvin Kamara", "Chris Olave"]),
        NFLTeam(name: "Philadelphia Eagles", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/PHI", playmakers: ["Saquon Barkley", "A.J. Brown"]),
        NFLTeam(name: "Seattle Seahawks", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/SEA", playmakers: ["Kenneth Walker", "Jaxon Smith-Njigba"]),
        NFLTeam(name: "Tennessee Titans", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/TEN", playmakers: ["Tony Pollard", "Calvin Ridley"]),
        NFLTeam(name: "Cleveland Browns", logoURL: "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/CLE", playmakers: ["Nick Chubb", "Jerry Jeudy"])
    ]
}
