package com.sliit.echanneling;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import java.awt.Desktop;
import java.io.File;
import java.net.Socket;
import java.net.URI;

/**
 * SLIIT SE2030 (Software Engineering) & IT2140 (Database Design and Development)
 * Web-Based E-Channeling System - Group ID: 2026-Y2-S1-KU-50
 *
 * Main Spring Boot Application Entry Point for IntelliJ IDEA
 * Automatically launches both Backend (Port 8080) and Frontend Vite Server (Port 5173) together!
 */
@org.springframework.scheduling.annotation.EnableScheduling
@SpringBootApplication
public class EChannelingApplication {

    public static void main(String[] args) {
        // Automatically start the Vite Frontend if not already running
        startFrontendDevServer();

        SpringApplication.run(EChannelingApplication.class, args);
        System.out.println("==================================================================");
        System.out.println(">>> SLIIT E-Channeling System Started Successfully!            <<<");
        System.out.println(">>> Backend REST API:  http://localhost:8080/api                <<<");
        System.out.println(">>> Built Web App:     http://localhost:8080                    <<<");
        System.out.println(">>> Live Vite Server:  http://localhost:5173                    <<<");
        System.out.println("==================================================================");
    }

    /**
     * Starts the frontend Vite dev server (npm run dev) from IntelliJ automatically
     */
    private static void startFrontendDevServer() {
        try {
            if (isPortInUse(5173)) {
                System.out.println(">>> Frontend Vite server is already active on port 5173. <<<");
                return;
            }

            File frontendDir = new File("frontend");
            if (!frontendDir.exists() || !new File(frontendDir, "package.json").exists()) {
                frontendDir = new File("../frontend");
            }
            if (!frontendDir.exists() || !new File(frontendDir, "package.json").exists()) {
                File parent = new File(System.getProperty("user.dir")).getParentFile();
                if (parent != null) {
                    File candidate = new File(parent, "frontend");
                    if (candidate.exists()) {
                        frontendDir = candidate;
                    }
                }
            }

            if (frontendDir.exists() && new File(frontendDir, "package.json").exists()) {
                System.out.println(">>> Automatically launching Frontend (npm run dev) from " + frontendDir.getCanonicalPath() + " ... <<<");
                ProcessBuilder pb = new ProcessBuilder("cmd", "/c", "npm run dev");
                pb.directory(frontendDir);
                pb.redirectErrorStream(true);
                pb.redirectOutput(ProcessBuilder.Redirect.DISCARD);
                Process process = pb.start();

                // Shutdown hook to gracefully stop frontend when IntelliJ stops
                Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                    try {
                        process.descendants().forEach(ProcessHandle::destroyForcibly);
                        process.destroyForcibly();
                    } catch (Exception ignored) {}
                }));
            }
        } catch (Exception e) {
            System.err.println("Note: Could not automatically launch frontend: " + e.getMessage());
        }
    }

    private static boolean isPortInUse(int port) {
        try (Socket s = new Socket("127.0.0.1", port)) {
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Automatically launches the default web browser the moment the application finishes starting up
     */
    @EventListener(ApplicationReadyEvent.class)
    public void launchBrowser() {
        // Give Vite a moment if it just started, then pick port 5173 or 8080
        String url = isPortInUse(5173) ? "http://localhost:5173" : "http://localhost:8080";
        System.out.println(">>> Automatically opening browser at " + url + " ... <<<");
        try {
            String os = System.getProperty("os.name").toLowerCase();
            if (os.contains("win")) {
                Runtime.getRuntime().exec(new String[]{"cmd", "/c", "start", url});
            } else if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                Desktop.getDesktop().browse(new URI(url));
            }
        } catch (Exception e) {
            System.err.println("Note: Could not open browser automatically: " + e.getMessage());
        }
    }
}
