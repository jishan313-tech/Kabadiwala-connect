package in.kabadiwala.connect.service;

import in.kabadiwala.connect.integration.StorageService;
import in.kabadiwala.connect.model.StoredDocument;
import in.kabadiwala.connect.repository.RecyclerProfileRepository;
import in.kabadiwala.connect.repository.StoredDocumentRepository;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf"
    );

    private static final long MAX_FILE_SIZE = 10_000_000L;

    private final StorageService storage;
    private final StoredDocumentRepository repository;
    private final RecyclerProfileRepository recyclers;

    public DocumentService(
            StorageService storage,
            StoredDocumentRepository repository,
            RecyclerProfileRepository recyclers) {
        this.storage = storage;
        this.repository = repository;
        this.recyclers = recyclers;
    }

    public StoredDocument upload(String owner, String purpose, MultipartFile file) {
        validateFile(file);

        var storedFile = storage.store(file, owner + "/" + purpose);

        var document = new StoredDocument();
        document.ownerId = owner;
        document.purpose = purpose;
        document.originalName = file.getOriginalFilename();
        document.mimeType = file.getContentType();
        document.size = file.getSize();
        document.storageKey = storedFile.key();
        document.url = storedFile.url();

        final StoredDocument savedDocument = repository.save(document);

        if ("recycler-document".equals(purpose)) {
            recyclers.findByUserId(owner).ifPresent(profile -> {
                profile.documentIds.add(savedDocument.id);
                recyclers.save(profile);
            });
        }

        return savedDocument;
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()
                || file.getSize() > MAX_FILE_SIZE
                || file.getContentType() == null
                || !ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException(
                    "Only JPG, PNG, WebP or PDF up to 10 MB is allowed"
            );
        }
    }
}