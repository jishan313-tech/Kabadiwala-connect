package in.kabadiwala.connect.repository; import in.kabadiwala.connect.model.Lot; import org.springframework.data.mongodb.repository.MongoRepository;
public interface LotRepository extends MongoRepository<Lot,String> {
java.util.Optional<Lot> findByLotId(String lotId); org.springframework.data.domain.Page<Lot> findByCollectorId(String collectorId,org.springframework.data.domain.Pageable pageable); org.springframework.data.domain.Page<Lot> findByStatus(in.kabadiwala.connect.model.LotStatus status,org.springframework.data.domain.Pageable pageable); org.springframework.data.domain.Page<Lot> findByStatusAndCategory(in.kabadiwala.connect.model.LotStatus status,String category,org.springframework.data.domain.Pageable pageable);
}
