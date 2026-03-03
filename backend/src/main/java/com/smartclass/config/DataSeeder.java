package com.smartclass.config;

import com.smartclass.model.Role;
import com.smartclass.model.User;
import com.smartclass.repository.StudentRepository;
import com.smartclass.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner loadData(StudentRepository studentRepo, UserRepository userRepo) {
        return args -> {
            // Only ensure Admin User Exists (required for first-time setup)
            if (userRepo.findByUsername("admin").isEmpty()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword("admin123");
                admin.setRole(Role.ADMIN);
                userRepo.save(admin);
                System.out.println("✅ Default Admin created: admin / admin123");
                System.out.println("⚠️  Please change the admin password after first login!");
            }
            
            // All other users (Teachers, Students) should be created via Admin Panel
            // Data is now stored permanently in the database file
            System.out.println("📁 Database location: ./data/smartclassdb");
        };
    }
}
