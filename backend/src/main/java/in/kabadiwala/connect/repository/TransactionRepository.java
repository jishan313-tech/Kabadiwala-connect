package in.kabadiwala.connect.repository; import in.kabadiwala.connect.model.Transaction; import org.springframework.data.mongodb.repository.MongoRepository;
public interface TransactionRepository extends MongoRepository<Transaction,String> {
java.util.Optional<Transaction> findByLotId(String lotId);
}
