package in.kabadiwala.connect.repository; import in.kabadiwala.connect.model.User; import org.springframework.data.mongodb.repository.MongoRepository;
public interface UserRepository extends MongoRepository<User,String> {
java.util.Optional<User> findByMobile(String mobile); java.util.Optional<User> findByEmail(String email);
}
