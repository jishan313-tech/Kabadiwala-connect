package in.kabadiwala.connect.repository; import in.kabadiwala.connect.model.Quotation; import org.springframework.data.mongodb.repository.MongoRepository;
public interface QuotationRepository extends MongoRepository<Quotation,String> {
java.util.List<Quotation> findByLotId(String lotId);
}
