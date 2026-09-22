package in.kabadiwala.connect.repository; import in.kabadiwala.connect.model.Pickup; import org.springframework.data.mongodb.repository.MongoRepository;
public interface PickupRepository extends MongoRepository<Pickup,String> {
java.util.Optional<Pickup> findByLotId(String lotId);
}
