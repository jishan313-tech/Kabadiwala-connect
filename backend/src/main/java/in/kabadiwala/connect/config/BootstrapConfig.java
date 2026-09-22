package in.kabadiwala.connect.config;

import in.kabadiwala.connect.model.*;
import in.kabadiwala.connect.repository.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class BootstrapConfig {

    @Bean
    CommandLineRunner bootstrap(
            UserRepository users,
            MaterialCategoryRepository cats,
            PasswordEncoder enc,
            @Value("${app.bootstrap.admin-mobile:}") String mobile,
            @Value("${app.bootstrap.admin-password:}") String password) {
        
        return args -> {
            // Create Admin User if properties are provided and user doesn't exist
            if (!mobile.isBlank() && !password.isBlank() && users.findByMobile(mobile).isEmpty()) {
                var a = new User();
                a.fullName = "Platform Administrator";
                a.mobile = mobile;
                a.passwordHash = enc.encode(password);
                a.role = Role.ADMIN;
                a.mobileVerified = true;
                users.save(a);
            }

            // Seed Material Categories if the database table is empty
            if (cats.count() == 0) {
                List<String[]> initialCategories = List.of(
                    new String[]{"MOBILE", "मोबाइल फोन", "मोबाईल फोन", "मोबाइल फोन"},
                    new String[]{"COMPUTER", "कंप्यूटर", "संगणक", "कंप्यूटर"},
                    new String[]{"LAPTOP", "लैपटॉप", "लॅपटॉप", "लैपटॉप"},
                    new String[]{"BATTERY", "बैटरी", "बॅटरी", "बैटरी"},
                    new String[]{"CABLE", "चार्जर / केबल", "चार्जर / केबल", "चार्जर / केबल"},
                    new String[]{"HOME_ELECTRONICS", "घरेलू इलेक्ट्रॉनिक्स", "घरगुती इलेक्ट्रॉनिक्स", "घर रो इलेक्ट्रॉनिक्स"}
                );

                for (String[] x : initialCategories) {
                    var c = new MaterialCategory();
                    c.code = x[0];
                    c.names = Map.of("hi", x[1], "mr", x[2], "mwr", x[3]);
                    c.units = List.of("kg", "piece");
                    cats.save(c);
                }
            }
        };
    }
}
