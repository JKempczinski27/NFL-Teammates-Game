//
//  RegistrationView.swift
//  TriviaGameiOS
//
//  Created on 2025-11-30
//

import SwiftUI

struct RegistrationView: View {
    @ObservedObject var viewModel: TriviaViewModel
    let onComplete: () -> Void

    @State private var name = ""
    @State private var email = ""
    @State private var showError = false
    @State private var errorMessage = ""

    var body: some View {
        VStack(spacing: 24) {
            Text("NFL Long Drive")
                .font(.system(size: 36, weight: .bold))
                .foregroundColor(.white)

            Text("🏈 Test your NFL knowledge and rack up yards!")
                .font(.headline)
                .foregroundColor(.white.opacity(0.9))
                .multilineTextAlignment(.center)

            VStack(spacing: 16) {
                TextField("Name", text: $name)
                    .textFieldStyle(.roundedBorder)
                    .textContentType(.name)
                    .autocapitalization(.words)

                TextField("Email", text: $email)
                    .textFieldStyle(.roundedBorder)
                    .textContentType(.emailAddress)
                    .autocapitalization(.none)
                    .keyboardType(.emailAddress)
            }
            .padding(.horizontal, 32)

            if showError {
                Text(errorMessage)
                    .foregroundColor(.red)
                    .font(.caption)
            }

            Button(action: handleStart) {
                Text("Start")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(red: 0.9, green: 0.58, blue: 0.13))
                    .cornerRadius(10)
            }
            .padding(.horizontal, 32)
        }
        .padding()
    }

    private func handleStart() {
        // Validate inputs
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "Please enter your name"
            showError = true
            return
        }

        guard !email.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "Please enter your email"
            showError = true
            return
        }

        // Basic email validation
        let emailRegex = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        guard emailPredicate.evaluate(with: email) else {
            errorMessage = "Please enter a valid email address"
            showError = true
            return
        }

        // Clear error and proceed
        showError = false
        viewModel.startGame(name: name, email: email)
        onComplete()
    }
}
